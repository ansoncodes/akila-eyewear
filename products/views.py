from decimal import Decimal, InvalidOperation

from rest_framework import permissions, viewsets
from rest_framework.exceptions import ValidationError

from .models import Collection, FrameMaterial, FrameShape, GlassesModel, Product
from .serializers import (
    CollectionSerializer,
    FrameMaterialSerializer,
    FrameShapeSerializer,
    GlassesModelSerializer,
    ProductSerializer,
)


class CollectionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CollectionSerializer

    def get_queryset(self):
        queryset = Collection.objects.all()
        if not (self.request.user.is_authenticated and self.request.user.is_staff):
            queryset = queryset.filter(is_active=True)
        return queryset


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        queryset = Product.objects.select_related(
            "collection", "frame_shape", "frame_material", "glasses_model"
        ).prefetch_related("images")

        if not (self.request.user.is_authenticated and self.request.user.is_staff):
            queryset = queryset.filter(is_active=True)

        frame_shape_id = self.request.query_params.get("frame_shape")
        collection_id = self.request.query_params.get("collection")
        gender = self.request.query_params.get("gender")
        min_price = self.request.query_params.get("min_price")
        max_price = self.request.query_params.get("max_price")

        if frame_shape_id:
            queryset = queryset.filter(frame_shape_id=frame_shape_id)
        if collection_id:
            queryset = queryset.filter(collection_id=collection_id)
        if gender:
            queryset = queryset.filter(gender__iexact=gender)

        if min_price:
            try:
                queryset = queryset.filter(price__gte=Decimal(min_price))
            except InvalidOperation as exc:
                raise ValidationError({"min_price": "Invalid number."}) from exc

        if max_price:
            try:
                queryset = queryset.filter(price__lte=Decimal(max_price))
            except InvalidOperation as exc:
                raise ValidationError({"max_price": "Invalid number."}) from exc

        return queryset


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
