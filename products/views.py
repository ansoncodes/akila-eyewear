from decimal import Decimal, InvalidOperation

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from accounts.permissions import IsAdminOrReadOnly
from .models import Category, Collection, FrameMaterial, FrameShape, GlassesModel, Product, ProductImage
from .serializers import (
    CalibrationBulkSerializer,
    CategorySerializer,
    CollectionSerializer,
    FrameMaterialSerializer,
    FrameShapeSerializer,
    GlassesModelSerializer,
    ProductImageSerializer,
    ProductSerializer,
)
from .services.calibration import apply_calibration, auto_calibrate_glasses_model

User = get_user_model()


class CollectionViewSet(viewsets.ModelViewSet):
    serializer_class = CollectionSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = Collection.objects.all()
        if not self._is_admin_user():
            queryset = queryset.filter(is_active=True)
        return queryset

    def _is_admin_user(self):
        user = self.request.user
        return bool(user and user.is_authenticated and user.role == User.Role.ADMIN)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]


class FrameShapeViewSet(viewsets.ModelViewSet):
    queryset = FrameShape.objects.all()
    serializer_class = FrameShapeSerializer
    permission_classes = [IsAdminOrReadOnly]


class FrameMaterialViewSet(viewsets.ModelViewSet):
    queryset = FrameMaterial.objects.all()
    serializer_class = FrameMaterialSerializer
    permission_classes = [IsAdminOrReadOnly]


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


class ProductImageViewSet(viewsets.ModelViewSet):
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        queryset = ProductImage.objects.select_related("product").all()
        product_id = self.request.query_params.get("product")
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset


class GlassesModelByProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = GlassesModel.objects.select_related("product")
    serializer_class = GlassesModelSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "product_id"
    lookup_url_kwarg = "product_id"


class GlassesModelAdminViewSet(viewsets.ModelViewSet):
    queryset = GlassesModel.objects.select_related("product", "product__category", "product__frame_shape")
    serializer_class = GlassesModelSerializer
    permission_classes = [permissions.IsAdminUser]
    calibration_fields = {
        "glb_file_url",
        "scale",
        "position_x",
        "position_y",
        "position_z",
        "rotation_x",
        "rotation_y",
        "rotation_z",
    }

    def perform_create(self, serializer):
        serializer.save(
            calibration_status=GlassesModel.CalibrationStatus.SUCCESS,
            calibration_source=GlassesModel.CalibrationSource.MANUAL,
            calibration_error="",
            last_calibrated_at=timezone.now(),
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        updated_fields = set(serializer.validated_data.keys())

        if updated_fields & self.calibration_fields:
            instance.calibration_status = GlassesModel.CalibrationStatus.SUCCESS
            instance.calibration_source = GlassesModel.CalibrationSource.MANUAL
            instance.calibration_error = ""
            instance.last_calibrated_at = timezone.now()
            instance.save(
                update_fields=[
                    "calibration_status",
                    "calibration_source",
                    "calibration_error",
                    "last_calibrated_at",
                ]
            )

    @action(detail=True, methods=["post"], url_path="run-calibration")
    def run_calibration(self, request, pk=None):
        glasses_model = self.get_object()
        result = auto_calibrate_glasses_model(glasses_model)
        updated = apply_calibration(glasses_model, result)
        return Response(self.get_serializer(updated).data)

    @action(detail=False, methods=["post"], url_path="run-calibration-bulk")
    def run_calibration_bulk(self, request):
        input_serializer = CalibrationBulkSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        ids = input_serializer.validated_data["ids"]
        queryset = self.get_queryset().filter(id__in=ids)

        results = []
        for glasses_model in queryset:
            result = auto_calibrate_glasses_model(glasses_model)
            updated = apply_calibration(glasses_model, result)
            results.append(self.get_serializer(updated).data)

        return Response(results, status=status.HTTP_200_OK)
