from django.db import models


class FrameShape(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class FrameMaterial(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Collection(models.Model):
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="collections/", blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    class Gender(models.TextChoices):
        MEN = "Men", "Men"
        WOMEN = "Women", "Women"
        UNISEX = "Unisex", "Unisex"

    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="products")
    collection = models.ForeignKey(Collection, on_delete=models.SET_NULL, null=True, related_name="products")
    frame_shape = models.ForeignKey(FrameShape, on_delete=models.SET_NULL, null=True, related_name="products")
    frame_material = models.ForeignKey(FrameMaterial, on_delete=models.SET_NULL, null=True, related_name="products")
    gender = models.CharField(max_length=10, choices=Gender.choices, default=Gender.UNISEX)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/")
    is_primary = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.product.name} image"


class GlassesModel(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name="glasses_model")
    glb_file_url = models.CharField(max_length=255)
    scale = models.FloatField(default=1.0)
    position_x = models.FloatField(default=0.0)
    position_y = models.FloatField(default=0.0)
    position_z = models.FloatField(default=0.0)
    rotation_x = models.FloatField(default=0.0)
    rotation_y = models.FloatField(default=0.0)
    rotation_z = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name} GLB"
