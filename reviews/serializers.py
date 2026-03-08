from rest_framework import serializers

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Review
        fields = ["id", "product", "user", "user_email", "rating", "comment", "created_at"]
        read_only_fields = ["id", "user", "user_email", "created_at"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
