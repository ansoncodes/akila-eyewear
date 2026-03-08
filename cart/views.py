from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsCustomer
from products.models import Product

from .models import Cart, CartItem
from .serializers import (
    AddCartItemSerializer,
    CartSerializer,
    UpdateCartItemSerializer,
)


class CartViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsCustomer]

    def _get_cart(self, user):
        cart, _ = Cart.objects.get_or_create(user=user)
        return cart

    def list(self, request):
        cart = self._get_cart(request.user)
        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=["post"], url_path="add")
    def add(self, request):
        serializer = AddCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = get_object_or_404(Product, id=serializer.validated_data["product_id"], is_active=True)
        quantity = serializer.validated_data["quantity"]

        cart = self._get_cart(request.user)
        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={"quantity": quantity},
        )
        if not created:
            item.quantity += quantity
            item.save(update_fields=["quantity"])

        return Response(CartSerializer(cart).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["patch"], url_path=r"update/(?P<item_id>[^/.]+)")
    def update_item(self, request, item_id=None):
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = self._get_cart(request.user)
        item = get_object_or_404(CartItem, id=item_id, cart=cart)
        item.quantity = serializer.validated_data["quantity"]
        item.save(update_fields=["quantity"])

        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=["delete"], url_path=r"remove/(?P<item_id>[^/.]+)")
    def remove_item(self, request, item_id=None):
        cart = self._get_cart(request.user)
        item = get_object_or_404(CartItem, id=item_id, cart=cart)
        item.delete()

        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)
