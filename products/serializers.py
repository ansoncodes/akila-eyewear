from rest_framework import serializers

from .models import Category, Collection, FrameMaterial, FrameShape, GlassesModel, Product, ProductImage


class FrameShapeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FrameShape
        fields = ["id", "name"]


class FrameMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = FrameMaterial
        fields = ["id", "name"]


class CollectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collection
        fields = ["id", "name", "description", "image", "is_active"]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "product", "image", "is_primary"]


class GlassesModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlassesModel
        fields = [
            "id",
            "product",
            "glb_file_url",
            "scale",
            "position_x",
            "position_y",
            "position_z",
            "rotation_x",
            "rotation_y",
            "rotation_z",
            "calibration_status",
            "calibration_source",
            "calibration_error",
            "last_calibrated_at",
            "created_at",
        ]
        read_only_fields = [
            "calibration_status",
            "calibration_source",
            "calibration_error",
            "last_calibrated_at",
            "created_at",
        ]


class CalibrationBulkSerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=False,
    )


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    glasses_model = GlassesModelSerializer(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "price",
            "discount_price",
            "category",
            "collection",
            "frame_shape",
            "frame_material",
            "gender",
            "is_active",
            "created_at",
            "images",
            "glasses_model",
        ]
