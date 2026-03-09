from django.db import IntegrityError
from django.contrib.auth import get_user_model
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response

from accounts.permissions import IsCustomer
from notifications.models import Notification

from .models import Review
from .serializers import ReviewSerializer

User = get_user_model()


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    queryset = Review.objects.select_related("user", "product")
    http_method_names = ["get", "post", "delete"]

    def get_permissions(self):
        if self.action == "list":
            return [permissions.AllowAny()]
        if self.action == "create":
            return [permissions.IsAuthenticated(), IsCustomer()]
        if self.action == "destroy":
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        product_id = self.request.query_params.get("product")

        if product_id:
            return queryset.filter(product_id=product_id)

        user = self.request.user
        if user.is_authenticated and user.role == "admin":
            return queryset

        return queryset.none()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            self.perform_create(serializer)
        except IntegrityError:
            return Response(
                {"detail": "You have already reviewed this product."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        review = serializer.instance
        self._notify_admins(
            "New Product Review",
            f"{request.user.email} reviewed product #{review.product_id} with {review.rating} stars.",
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        review = self.get_object()

        if request.user.role != "admin" and review.user_id != request.user.id:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        review.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _notify_admins(self, title, message):
        admins = User.objects.filter(role=User.Role.ADMIN).only("id")
        Notification.objects.bulk_create(
            [Notification(user=admin, title=title, message=message) for admin in admins]
        )
