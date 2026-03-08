from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CollectionViewSet,
    FrameMaterialViewSet,
    FrameShapeViewSet,
    GlassesModelViewSet,
    ProductViewSet,
)

router = DefaultRouter()
router.register("products", ProductViewSet, basename="product")
router.register("collections", CollectionViewSet, basename="collection")
router.register("frame-shapes", FrameShapeViewSet, basename="frame-shape")
router.register("frame-materials", FrameMaterialViewSet, basename="frame-material")

urlpatterns = [
    path(
        "products/<int:product_id>/glasses-model/",
        GlassesModelViewSet.as_view({"get": "retrieve"}),
        name="glasses-model-by-product",
    ),
    path("", include(router.urls)),
]
