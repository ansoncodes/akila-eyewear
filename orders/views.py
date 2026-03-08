from decimal import Decimal
from uuid import uuid4

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsCustomer
from cart.models import Cart

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

        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = Cart.objects.filter(user=request.user).prefetch_related("items__product").first()
        if not cart or not cart.items.exists():
            return Response({"detail": "Your cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

        total_amount = Decimal("0.00")
        order = Order.objects.create(user=request.user, status=Order.Status.PENDING, total_amount=0)

        for item in cart.items.all():
            price = item.product.discount_price or item.product.price
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price_at_purchase=price,
            )
            total_amount += price * item.quantity

        order.total_amount = total_amount
        order.save(update_fields=["total_amount"])

        ShippingAddress.objects.create(order=order, **serializer.validated_data["shipping_address"])

        Payment.objects.create(
            order=order,
            amount=total_amount,
            status=Payment.Status.PENDING,
            payment_method=serializer.validated_data["payment_method"],
            transaction_id=None,
        )

        cart.items.all().delete()
        output = self.get_serializer(order)
        return Response(output.data, status=status.HTTP_201_CREATED)


class PaymentViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsCustomer]

    def _get_payment(self, request, order_id):
        payment = get_object_or_404(Payment.objects.select_related("order__user"), order_id=order_id)
        if payment.order.user_id != request.user.id:
            return None
        return payment

    def retrieve(self, request, order_id=None):
        payment = self._get_payment(request, order_id)
        if payment is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(PaymentSerializer(payment).data)

    @action(detail=False, methods=["post"], url_path=r"pay/(?P<order_id>[^/.]+)")
    def pay(self, request, order_id=None):
        payment = self._get_payment(request, order_id)
        if payment is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if payment.status == Payment.Status.PAID:
            return Response(PaymentSerializer(payment).data)

        payment.status = Payment.Status.PAID
        payment.transaction_id = str(uuid4())
        payment.save(update_fields=["status", "transaction_id"])

        order = payment.order
        order.status = Order.Status.CONFIRMED
        order.save(update_fields=["status"])

        return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)
