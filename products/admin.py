from django.contrib import admin

from .models import Collection, FrameMaterial, FrameShape, GlassesModel, Product, ProductImage


@admin.register(FrameShape)
class FrameShapeAdmin(admin.ModelAdmin):
    list_display = ("id", "name")


@admin.register(FrameMaterial)
class FrameMaterialAdmin(admin.ModelAdmin):
    list_display = ("id", "name")


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "is_active")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "price", "gender", "is_active")
    list_filter = ("gender", "is_active", "collection", "frame_shape", "frame_material")
    inlines = [ProductImageInline]


@admin.register(GlassesModel)
class GlassesModelAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "product",
        "glb_file_url",
        "scale",
        "position_x",
        "position_y",
        "position_z",
        "created_at",
    )
    list_filter = ("created_at",)
    search_fields = ("product__name", "glb_file_url")
