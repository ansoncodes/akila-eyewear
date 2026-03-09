from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsCustomer
from products.models import Product

from .models import Wishlist, WishlistItem
from .serializers import AddWishlistItemSerializer, WishlistSerializer


class WishlistViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsCustomer]

    def list(self, request):
        wishlist = self._get_wishlist(request.user)
        return Response(self._serialize_wishlist(wishlist))

    @action(detail=False, methods=["post"], url_path="add")
    def add(self, request):
        serializer = AddWishlistItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = get_object_or_404(
            Product,
            id=serializer.validated_data["product_id"],
            is_active=True,
        )
        wishlist = self._get_wishlist(request.user)
        WishlistItem.objects.get_or_create(wishlist=wishlist, product=product)

        return Response(self._serialize_wishlist(wishlist), status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["delete"], url_path=r"remove/(?P<item_id>[^/.]+)")
    def remove_item(self, request, item_id=None):
        wishlist = self._get_wishlist(request.user)
        item = get_object_or_404(WishlistItem, id=item_id, wishlist=wishlist)
        item.delete()

        return Response(self._serialize_wishlist(wishlist), status=status.HTTP_200_OK)

    def _get_wishlist(self, user):
        wishlist, _ = Wishlist.objects.get_or_create(user=user)
        return wishlist

    def _serialize_wishlist(self, wishlist):
        return WishlistSerializer(wishlist).data
