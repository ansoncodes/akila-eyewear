from django.contrib import admin, messages

from .models import Category, Collection, FrameMaterial, FrameShape, GlassesModel, Product, ProductImage
from .services.ai_calibration import apply_calibration, auto_calibrate_glasses_model


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


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "category", "price", "gender", "is_active")
    list_filter = ("category", "gender", "is_active", "collection", "frame_shape", "frame_material")
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
        "calibration_status",
        "calibration_source",
        "last_calibrated_at",
        "created_at",
    )
    list_filter = ("calibration_status", "calibration_source", "created_at")
    search_fields = ("product__name", "glb_file_url")
    readonly_fields = ("last_calibrated_at", "calibration_error")
    actions = ["run_ai_auto_calibration"]

    @admin.action(description="Run AI auto calibration on selected models")
    def run_ai_auto_calibration(self, request, queryset):
        success_count = 0
        failed_count = 0

        models = queryset.select_related("product", "product__category", "product__frame_shape")

        for glasses_model in models:
            result = auto_calibrate_glasses_model(glasses_model)
            updated = apply_calibration(glasses_model, result)
            if updated.calibration_status == GlassesModel.CalibrationStatus.SUCCESS:
                success_count += 1
            else:
                failed_count += 1

        if success_count:
            self.message_user(
                request,
                f"AI calibration completed for {success_count} model(s).",
                level=messages.SUCCESS,
            )
        if failed_count:
            self.message_user(
                request,
                f"Calibration failed for {failed_count} model(s). Check calibration_error field.",
                level=messages.WARNING,
            )
