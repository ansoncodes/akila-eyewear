from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import OrderViewSet, PaymentViewSet

router = DefaultRouter()
router.register("orders", OrderViewSet, basename="order")

payment_view = PaymentViewSet.as_view

urlpatterns = [
    path("", include(router.urls)),
    path("payments/pay/<int:order_id>/", payment_view({"post": "pay"}), name="payment-pay"),
    path("payments/<int:order_id>/", payment_view({"get": "retrieve"}), name="payment-detail"),
]
