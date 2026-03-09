from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryViewSet,
    CollectionViewSet,
    FrameMaterialViewSet,
    FrameShapeViewSet,
    GlassesModelAdminViewSet,
    GlassesModelByProductViewSet,
    ProductImageViewSet,
    ProductViewSet,
)

router = DefaultRouter()
router.register("products", ProductViewSet, basename="product")
router.register("collections", CollectionViewSet, basename="collection")
router.register("categories", CategoryViewSet, basename="category")
router.register("frame-shapes", FrameShapeViewSet, basename="frame-shape")
router.register("frame-materials", FrameMaterialViewSet, basename="frame-material")
router.register("product-images", ProductImageViewSet, basename="product-image")
router.register("glasses-models", GlassesModelAdminViewSet, basename="glasses-model")

urlpatterns = [
    path(
        "products/<int:product_id>/glasses-model/",
        GlassesModelByProductViewSet.as_view({"get": "retrieve"}),
        name="glasses-model-by-product",
    ),
    path("", include(router.urls)),
]
