from django.db import IntegrityError
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response

from accounts.permissions import IsCustomer, IsReviewOwnerOrReadOnly

from .models import Review
from .serializers import ReviewSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    queryset = Review.objects.select_related("user", "product")
    http_method_names = ["get", "post", "delete"]

    def get_permissions(self):
        action_permissions = {
            "list": [permissions.AllowAny],
            "create": [permissions.IsAuthenticated, IsCustomer],
            "destroy": [permissions.IsAuthenticated, IsCustomer, IsReviewOwnerOrReadOnly],
        }
        classes = action_permissions.get(self.action, [permissions.IsAuthenticated])
        return [permission() for permission in classes]

    def get_queryset(self):
        product_id = self.request.query_params.get("product")
        if not product_id:
            return Review.objects.none()
        return self.queryset.filter(product_id=product_id)

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

        return Response(serializer.data, status=status.HTTP_201_CREATED)
