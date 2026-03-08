from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsCustomer

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsCustomer]

    def list(self, request):
        notifications = self._get_user_notifications(request.user)
        return Response(self._serialize_notifications(notifications, many=True))

    @action(detail=True, methods=["post"], url_path="read")
    def mark_read(self, request, pk=None):
        notification = get_object_or_404(self._get_user_notifications(request.user), pk=pk)

        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=["is_read"])

        return Response(self._serialize_notifications(notification))

    @action(detail=False, methods=["post"], url_path="read-all")
    def mark_all_read(self, request):
        self._get_user_notifications(request.user).filter(is_read=False).update(is_read=True)
        return Response({"detail": "All notifications marked as read."}, status=status.HTTP_200_OK)

    def _get_user_notifications(self, user):
        return Notification.objects.filter(user=user)

    def _serialize_notifications(self, obj, many=False):
        return NotificationSerializer(obj, many=many).data
