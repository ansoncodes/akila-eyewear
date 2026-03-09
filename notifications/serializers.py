from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Notification

User = get_user_model()


class NotificationSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Notification
        fields = ["id", "user", "user_email", "title", "message", "is_read", "created_at"]
        read_only_fields = ["id", "created_at", "user_email"]


class NotificationCreateSerializer(serializers.Serializer):
    user = serializers.IntegerField(required=False)
    title = serializers.CharField(max_length=120)
    message = serializers.CharField()
    broadcast_customers = serializers.BooleanField(default=False)

    def validate(self, attrs):
        broadcast = attrs.get("broadcast_customers", False)
        user_id = attrs.get("user")

        if not broadcast and not user_id:
            raise serializers.ValidationError({"user": "Provide user id or enable broadcast_customers."})

        if user_id:
            user = User.objects.filter(id=user_id).first()
            if not user:
                raise serializers.ValidationError({"user": "Invalid user id."})
            attrs["user_obj"] = user

        return attrs
