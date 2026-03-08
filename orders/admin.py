from django.contrib import admin

from .models import Order, OrderItem, Payment, ShippingAddress


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "status", "total_amount", "created_at")
    list_filter = ("status", "created_at")
    inlines = [OrderItemInline]


@admin.register(ShippingAddress)
class ShippingAddressAdmin(admin.ModelAdmin):
    list_display = ("order", "full_name", "phone", "city", "state", "pincode", "country")


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("order", "amount", "status", "payment_method", "transaction_id", "created_at")
    list_filter = ("status", "payment_method")
