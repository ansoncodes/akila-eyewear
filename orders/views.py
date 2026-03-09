from decimal import Decimal
from uuid import uuid4

from django.contrib.auth import get_user_model
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from cart.models import Cart
from notifications.models import Notification

from .models import Order, OrderItem, Payment, ShippingAddress
from .serializers import CreateOrderSerializer, OrderSerializer, PaymentSerializer

User = get_user_model()


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
        self._notify_admins(
            "New Order Placed",
            f"Order #{order.id} was placed by {request.user.email}.",
        )

        cart.items.all().delete()
        output_serializer = self.get_serializer(order)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch"], url_path="status")
    def update_status(self, request, pk=None):
        if request.user.role != "admin":
            return Response({"detail": "Only admins can update order status."}, status=status.HTTP_403_FORBIDDEN)

        order = self.get_object()
        next_status = request.data.get("status")
        valid_statuses = {choice[0] for choice in Order.Status.choices}

        if next_status not in valid_statuses:
            return Response({"detail": "Invalid status value."}, status=status.HTTP_400_BAD_REQUEST)

        order.status = next_status
        order.save(update_fields=["status"])

        self._notify(
            order.user,
            "Order Status Updated",
            f"Your order #{order.id} status changed to {order.status}.",
        )
        if next_status in {Order.Status.CANCELLED, Order.Status.DELIVERED}:
            self._notify_admins(
                "Order Status Alert",
                f"Order #{order.id} is now {next_status}.",
            )

        return Response(self.get_serializer(order).data)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        if request.user.role != "customer":
            return Response({"detail": "Only customers can cancel orders."}, status=status.HTTP_403_FORBIDDEN)

        order = self.get_object()
        if order.status == Order.Status.CANCELLED:
            return Response(self.get_serializer(order).data)

        if order.status in {Order.Status.SHIPPED, Order.Status.DELIVERED}:
            return Response(
                {"detail": "This order can no longer be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.status = Order.Status.CANCELLED
        order.save(update_fields=["status"])

        self._notify(
            order.user,
            "Order Cancelled",
            f"Your order #{order.id} has been cancelled.",
        )
        self._notify_admins(
            "Order Status Alert",
            f"Order #{order.id} is now {Order.Status.CANCELLED}.",
        )

        return Response(self.get_serializer(order).data)

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

    def _notify_admins(self, title, message):
        admins = User.objects.filter(role=User.Role.ADMIN).only("id")
        Notification.objects.bulk_create(
            [Notification(user=admin, title=title, message=message) for admin in admins]
        )


class PaymentViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        queryset = Payment.objects.select_related("order", "order__user")
        if request.user.role != "admin":
            queryset = queryset.filter(order__user=request.user)
        return Response(PaymentSerializer(queryset, many=True).data)

    def retrieve(self, request, order_id=None):
        payment = self._get_user_payment(request, order_id)
        return Response(PaymentSerializer(payment).data)

    @action(detail=False, methods=["post"], url_path=r"pay/(?P<order_id>[^/.]+)")
    def pay(self, request, order_id=None):
        payment = self._get_user_payment(request, order_id)

        if request.user.role != "admin" and payment.order.user_id != request.user.id:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        if payment.status == Payment.Status.PAID:
            return Response(PaymentSerializer(payment).data)

        payment.status = Payment.Status.PAID
        payment.transaction_id = str(uuid4())
        payment.save(update_fields=["status", "transaction_id"])

        Notification.objects.create(
            user=payment.order.user,
            title="Payment Successful",
            message=f"Payment received for order #{payment.order.id}. Your order remains pending.",
        )

        return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)

    def _get_user_payment(self, request, order_id):
        queryset = Payment.objects.select_related("order", "order__user")
        if request.user.role == "admin":
            return get_object_or_404(queryset, order_id=order_id)
        return get_object_or_404(queryset, order_id=order_id, order__user=request.user)
