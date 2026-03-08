from rest_framework import serializers

from .models import Collection, FrameMaterial, FrameShape, GlassesModel, Product, ProductImage


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


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "is_primary"]


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
            "created_at",
        ]


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
            "collection",
            "frame_shape",
            "frame_material",
            "gender",
            "is_active",
            "created_at",
            "images",
            "glasses_model",
        ]
