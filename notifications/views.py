from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationCreateSerializer, NotificationSerializer

User = get_user_model()


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    queryset = Notification.objects.select_related("user")
    http_method_names = ["get", "post", "delete"]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == User.Role.ADMIN:
            return queryset
        return queryset.filter(user=self.request.user)

    def get_permissions(self):
        if self.action in {"list", "retrieve", "mark_read", "mark_all_read"}:
            return [permissions.IsAuthenticated()]
        if self.action in {"create", "destroy"}:
            return [permissions.IsAuthenticated(), permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        serializer = NotificationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        title = serializer.validated_data["title"]
        message = serializer.validated_data["message"]

        created = []
        if serializer.validated_data.get("broadcast_customers"):
            customers = User.objects.filter(role=User.Role.CUSTOMER)
            created = [Notification(user=user, title=title, message=message) for user in customers]
            Notification.objects.bulk_create(created)
            return Response({"detail": f"Sent to {len(created)} customers."}, status=status.HTTP_201_CREATED)

        user = serializer.validated_data["user_obj"]
        notification = Notification.objects.create(user=user, title=title, message=message)
        return Response(NotificationSerializer(notification).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="read")
    def mark_read(self, request, pk=None):
        notification = get_object_or_404(self.get_queryset(), pk=pk)

        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=["is_read"])

        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=["post"], url_path="read-all")
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"detail": "All notifications marked as read."}, status=status.HTTP_200_OK)
