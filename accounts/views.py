from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import generics, permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import (
    AdminCustomerDetailSerializer,
    AdminCustomerListSerializer,
    LoginSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    UserSerializer,
    customer_queryset_with_stats,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]


class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)

    def delete(self, request):
        request.user.delete()
        return Response(status=204)


class AdminCustomerViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return AdminCustomerDetailSerializer
        return AdminCustomerListSerializer

    def get_queryset(self):
        queryset = User.objects.filter(role=User.Role.CUSTOMER).order_by("-date_joined")
        queryset = customer_queryset_with_stats(queryset)

        query = self.request.query_params.get("q")
        if query:
            queryset = queryset.filter(
                Q(email__icontains=query)
                | Q(first_name__icontains=query)
                | Q(last_name__icontains=query)
            )

        return queryset
