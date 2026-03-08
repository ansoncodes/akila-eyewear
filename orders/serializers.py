from rest_framework import serializers

from .models import Order, OrderItem, Payment, ShippingAddress


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "quantity", "price_at_purchase"]


class ShippingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = [
            "full_name",
            "phone",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "pincode",
            "country",
        ]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["amount", "status", "payment_method", "transaction_id", "created_at"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    shipping_address = ShippingAddressSerializer(read_only=True)
    payment = PaymentSerializer(read_only=True)

    class Meta:
        model = Order
        fields = ["id", "user", "status", "total_amount", "created_at", "items", "shipping_address", "payment"]
        read_only_fields = ["id", "user", "status", "total_amount", "created_at", "items", "shipping_address", "payment"]


class CreateOrderSerializer(serializers.Serializer):
    shipping_address = ShippingAddressSerializer()
    payment_method = serializers.CharField(max_length=50)
