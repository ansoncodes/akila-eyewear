from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AdminCustomerViewSet, LoginView, MeView, RefreshView, RegisterView

router = DefaultRouter()
router.register("admin/customers", AdminCustomerViewSet, basename="admin-customer")

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/refresh/", RefreshView.as_view(), name="token-refresh"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
]
