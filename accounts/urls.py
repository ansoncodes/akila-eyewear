from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AdminCustomerViewSet, ChangePasswordView, LoginView, LogoutView, MeView, RefreshView, RegisterView

router = DefaultRouter()
router.register("admin/customers", AdminCustomerViewSet, basename="admin-customer")

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/refresh/", RefreshView.as_view(), name="token-refresh"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("", include(router.urls)),
]
