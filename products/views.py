from decimal import Decimal, InvalidOperation

from django.contrib.auth import get_user_model
from rest_framework import permissions, viewsets
from rest_framework.exceptions import ValidationError

from .models import Category, Collection, FrameMaterial, FrameShape, GlassesModel, Product
from .serializers import (
    CategorySerializer,
    CollectionSerializer,
    FrameMaterialSerializer,
    FrameShapeSerializer,
    GlassesModelSerializer,
    ProductSerializer,
)

User = get_user_model()


class CollectionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CollectionSerializer

    def get_queryset(self):
        queryset = Collection.objects.all()
        if not self._is_admin_user():
            queryset = queryset.filter(is_active=True)
        return queryset

    def _is_admin_user(self):
        user = self.request.user
        return bool(user and user.is_authenticated and user.role == User.Role.ADMIN)


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        queryset = Product.objects.select_related(
            "category", "collection", "frame_shape", "frame_material", "glasses_model"
        ).prefetch_related("images")

        if not self._is_admin_user():
            queryset = queryset.filter(is_active=True)

        queryset = self._apply_basic_filters(queryset)
        queryset = self._apply_price_filters(queryset)
        return queryset

    def _is_admin_user(self):
        user = self.request.user
        return bool(user and user.is_authenticated and user.role == User.Role.ADMIN)

    def _apply_basic_filters(self, queryset):
        filters = {
            "category": "category_id",
            "frame_shape": "frame_shape_id",
            "collection": "collection_id",
        }

        for query_param, field_name in filters.items():
            value = self.request.query_params.get(query_param)
            if value:
                queryset = queryset.filter(**{field_name: value})

        gender = self.request.query_params.get("gender")
        if gender:
            queryset = queryset.filter(gender__iexact=gender)

        return queryset

    def _apply_price_filters(self, queryset):
        min_price = self._parse_decimal_param("min_price")
        max_price = self._parse_decimal_param("max_price")

        if min_price is not None:
            queryset = queryset.filter(price__gte=min_price)
        if max_price is not None:
            queryset = queryset.filter(price__lte=max_price)

        return queryset

    def _parse_decimal_param(self, field_name):
        value = self.request.query_params.get(field_name)
        if not value:
            return None

        try:
            return Decimal(value)
        except InvalidOperation as exc:
            raise ValidationError({field_name: "Invalid number."}) from exc


class GlassesModelViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = GlassesModel.objects.select_related("product")
    serializer_class = GlassesModelSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "product_id"
    lookup_url_kwarg = "product_id"


class FrameShapeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FrameShape.objects.all()
    serializer_class = FrameShapeSerializer
    permission_classes = [permissions.AllowAny]


class FrameMaterialViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FrameMaterial.objects.all()
    serializer_class = FrameMaterialSerializer
    permission_classes = [permissions.AllowAny]


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
