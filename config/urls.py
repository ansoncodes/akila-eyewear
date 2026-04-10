from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path, re_path
from django.views.static import serve


def health(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("health/", health),
    path("admin/", admin.site.urls),
    path("api/", include("accounts.urls")),
    path("api/", include("products.urls")),
    path("api/", include("cart.urls")),
    path("api/", include("orders.urls")),
    path("api/", include("reviews.urls")),
    path("api/", include("wishlist.urls")),
    path("api/", include("notifications.urls")),
]

# Serve media files in production for Render's ephemeral disk (Since seed_data regenerates them on deploy)
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
