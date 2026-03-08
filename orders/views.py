from decimal import Decimal
from uuid import uuid4

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsCustomer
from cart.models import Cart
from notifications.models import Notification

from .models import Order, OrderItem, Payment, ShippingAddress
from .serializers import CreateOrderSerializer, OrderSerializer, PaymentSerializer


class OrderViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Order.objects.select_related("user", "shipping_address", "payment").prefetch_related("items__product")

        if self.request.user.role == "admin":
            return queryset.order_by("-created_at")

        return queryset.filter(user=self.request.user).order_by("-created_at")

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        if request.user.role != "customer":
            return Response({"detail": "Only customers can place orders."}, status=status.HTTP_403_FORBIDDEN)

        input_serializer = CreateOrderSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        cart = self._get_user_cart(request.user)
        if cart is None or not cart.items.exists():
            return Response({"detail": "Your cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

        order, total_amount = self._create_order_with_items(request.user, cart)

        ShippingAddress.objects.create(
            order=order,
            **input_serializer.validated_data["shipping_address"],
        )

        Payment.objects.create(
            order=order,
            amount=total_amount,
            status=Payment.Status.PENDING,
            payment_method=input_serializer.validated_data["payment_method"],
            transaction_id=None,
        )

        self._notify(
            request.user,
            "Order Placed",
            f"Your order #{order.id} has been placed and is pending payment.",
        )

        cart.items.all().delete()
        output_serializer = self.get_serializer(order)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def _get_user_cart(self, user):
        return Cart.objects.filter(user=user).prefetch_related("items__product").first()

    def _create_order_with_items(self, user, cart):
        total_amount = Decimal("0.00")
        order = Order.objects.create(user=user, status=Order.Status.PENDING, total_amount=0)

        for cart_item in cart.items.all():
            item_price = cart_item.product.discount_price or cart_item.product.price
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                quantity=cart_item.quantity,
                price_at_purchase=item_price,
            )
            total_amount += item_price * cart_item.quantity

        order.total_amount = total_amount
        order.save(update_fields=["total_amount"])
        return order, total_amount

    def _notify(self, user, title, message):
        Notification.objects.create(user=user, title=title, message=message)


class PaymentViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsCustomer]

    def retrieve(self, request, order_id=None):
        payment = self._get_user_payment(request.user, order_id)
        return Response(PaymentSerializer(payment).data)

    @action(detail=False, methods=["post"], url_path=r"pay/(?P<order_id>[^/.]+)")
    def pay(self, request, order_id=None):
        payment = self._get_user_payment(request.user, order_id)

        if payment.status == Payment.Status.PAID:
            return Response(PaymentSerializer(payment).data)

        payment.status = Payment.Status.PAID
        payment.transaction_id = str(uuid4())
        payment.save(update_fields=["status", "transaction_id"])

        payment.order.status = Order.Status.CONFIRMED
        payment.order.save(update_fields=["status"])

        Notification.objects.create(
            user=request.user,
            title="Payment Successful",
            message=f"Payment received for order #{payment.order.id}. Your order is now confirmed.",
        )

        return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)

    def _get_user_payment(self, user, order_id):
        return get_object_or_404(Payment.objects.select_related("order"), order_id=order_id, order__user=user)
