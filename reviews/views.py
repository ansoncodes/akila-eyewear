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
        if self.action == "list":
            return [permissions.AllowAny()]
        if self.action == "create":
            return [permissions.IsAuthenticated(), IsCustomer()]
        if self.action == "destroy":
            return [permissions.IsAuthenticated(), IsCustomer(), IsReviewOwnerOrReadOnly()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        product_id = self.request.query_params.get("product")
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        else:
            queryset = queryset.none()
        return queryset

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
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
