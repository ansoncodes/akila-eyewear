from django.contrib.auth import get_user_model
from django.db.models import Count, Sum
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "email", "password", "first_name", "last_name"]

    def create(self, validated_data):
        return User.objects.create_user(role=User.Role.CUSTOMER, **validated_data)


class LoginSerializer(TokenObtainPairSerializer):
    username_field = User.EMAIL_FIELD

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["email"] = user.email
        return token


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "role"]


class AdminCustomerListSerializer(serializers.ModelSerializer):
    order_count = serializers.IntegerField(read_only=True)
    total_spend = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    review_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "date_joined",
            "order_count",
            "total_spend",
            "review_count",
        ]


class AdminCustomerDetailSerializer(serializers.ModelSerializer):
    order_count = serializers.SerializerMethodField()
    total_spend = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    orders = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "date_joined",
            "last_login",
            "order_count",
            "total_spend",
            "review_count",
            "orders",
            "reviews",
        ]

    def get_order_count(self, obj):
        return obj.orders.count()

    def get_total_spend(self, obj):
        total = obj.orders.aggregate(total=Sum("total_amount"))["total"]
        return total or 0

    def get_review_count(self, obj):
        return obj.reviews.count()

    def get_orders(self, obj):
        return list(
            obj.orders.order_by("-created_at")
            .values("id", "status", "total_amount", "created_at")[:15]
        )

    def get_reviews(self, obj):
        return list(
            obj.reviews.order_by("-created_at")
            .values("id", "product_id", "rating", "comment", "created_at")[:15]
        )


def customer_queryset_with_stats(queryset):
    return queryset.annotate(
        order_count=Count("orders", distinct=True),
        total_spend=Sum("orders__total_amount"),
        review_count=Count("reviews", distinct=True),
    )
