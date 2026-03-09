from io import BytesIO

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from PIL import Image

from products.models import Category, Collection, FrameMaterial, FrameShape, GlassesModel, Product, ProductImage


class Command(BaseCommand):
    help = "Seeds sample Akila ecommerce data"

    def handle(self, *args, **options):
        self.create_admin_user()
        collection = self.create_collection()
        categories = self.create_categories()
        shapes = self.create_shapes()
        materials = self.create_materials()
        self.create_products(collection, categories, shapes, materials)
        self.stdout.write(self.style.SUCCESS("Seed data created successfully."))

    def create_admin_user(self):
        User = get_user_model()
        admin_email = "admin@akila.com"
        admin_password = "Admin@12345"

        admin_user, created = User.objects.get_or_create(
            email=admin_email,
            defaults={
                "role": User.Role.ADMIN,
                "is_staff": True,
                "is_superuser": True,
                "first_name": "Akila",
                "last_name": "Admin",
            },
        )

        if created:
            admin_user.set_password(admin_password)
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f"Admin created: {admin_email}"))
        else:
            self.stdout.write(f"Admin already exists: {admin_email}")

    def create_shapes(self):
        shape_names = ["Rectangle", "Round", "Cat Eye", "Aviator"]
        shapes = {}
        for name in shape_names:
            shape, _ = FrameShape.objects.get_or_create(name=name)
            shapes[name] = shape
        return shapes

    def create_categories(self):
        category_names = ["Eyeglasses", "Sunglasses", "Reading Glasses"]
        categories = {}
        for name in category_names:
            category, _ = Category.objects.get_or_create(name=name)
            categories[name] = category
        return categories

    def create_materials(self):
        material_names = ["Metal", "Acetate", "TR90"]
        materials = {}
        for name in material_names:
            material, _ = FrameMaterial.objects.get_or_create(name=name)
            materials[name] = material
        return materials

    def create_collection(self):
        collection, _ = Collection.objects.get_or_create(
            name="Akila Essentials",
            defaults={
                "description": "Signature eyewear crafted for everyday style.",
                "is_active": True,
            },
        )
        return collection

    def create_products(self, collection, categories, shapes, materials):
        product_data = [
            {
                "name": "Solstice 01",
                "description": "Classic rectangle frame in premium acetate.",
                "price": "10707.00",
                "discount_price": "9047.00",
                "category": "Eyeglasses",
                "shape": "Rectangle",
                "material": "Acetate",
                "gender": Product.Gender.UNISEX,
                "color": (39, 42, 48),
                "glb": "/models/blue_rectangle_glasses.glb",
                "calibration": {
                    "scale": 1.0,
                    "position_x": 0.0,
                    "position_y": 0.02,
                    "position_z": 0.03,
                    "rotation_x": 0.0,
                    "rotation_y": 0.0,
                    "rotation_z": 0.0,
                },
            },
            {
                "name": "Lunar 02",
                "description": "Round metal silhouette with lightweight build.",
                "price": "12367.00",
                "discount_price": "10707.00",
                "category": "Sunglasses",
                "shape": "Round",
                "material": "Metal",
                "gender": Product.Gender.UNISEX,
                "color": (58, 80, 109),
                "glb": "/models/green_round_sunglasses.glb",
                "calibration": {
                    "scale": 0.98,
                    "position_x": 0.0,
                    "position_y": 0.015,
                    "position_z": 0.035,
                    "rotation_x": 0.0,
                    "rotation_y": 0.0,
                    "rotation_z": 0.0,
                },
            },
            {
                "name": "Muse 03",
                "description": "Cat eye frame with polished temple finish.",
                "price": "13197.00",
                "discount_price": "11537.00",
                "category": "Eyeglasses",
                "shape": "Cat Eye",
                "material": "Acetate",
                "gender": Product.Gender.WOMEN,
                "color": (130, 65, 74),
                "glb": "/models/ray-ban_glasses.glb",
                "calibration": {
                    "scale": 1.02,
                    "position_x": 0.0,
                    "position_y": 0.018,
                    "position_z": 0.03,
                    "rotation_x": 0.0,
                    "rotation_y": 0.0,
                    "rotation_z": 0.0,
                },
            },
            {
                "name": "Pilot 04",
                "description": "Aviator design with contemporary bridge detail.",
                "price": "14027.00",
                "discount_price": "12367.00",
                "category": "Sunglasses",
                "shape": "Aviator",
                "material": "Metal",
                "gender": Product.Gender.MEN,
                "color": (92, 88, 68),
                "glb": "/models/thug_life_glasses.glb",
                "calibration": {
                    "scale": 1.05,
                    "position_x": 0.0,
                    "position_y": 0.022,
                    "position_z": 0.04,
                    "rotation_x": 0.0,
                    "rotation_y": 0.0,
                    "rotation_z": 0.0,
                },
            },
            {
                "name": "Vector 05",
                "description": "Sport-inspired TR90 frame built for comfort.",
                "price": "9877.00",
                "discount_price": "8217.00",
                "category": "Reading Glasses",
                "shape": "Rectangle",
                "material": "TR90",
                "gender": Product.Gender.MEN,
                "color": (53, 91, 77),
                "glb": "/models/reading_glasses.glb",
                "calibration": {
                    "scale": 0.97,
                    "position_x": 0.0,
                    "position_y": 0.012,
                    "position_z": 0.028,
                    "rotation_x": 0.0,
                    "rotation_y": 0.0,
                    "rotation_z": 0.0,
                },
            },
        ]

        for index, item in enumerate(product_data, start=1):
            product, _ = Product.objects.update_or_create(
                name=item["name"],
                defaults={
                    "description": item["description"],
                    "price": item["price"],
                    "discount_price": item["discount_price"],
                    "category": categories[item["category"]],
                    "collection": collection,
                    "frame_shape": shapes[item["shape"]],
                    "frame_material": materials[item["material"]],
                    "gender": item["gender"],
                    "is_active": True,
                },
            )

            if not product.images.exists():
                image_content = self.generate_image(item["color"])
                ProductImage.objects.create(
                    product=product,
                    image=ContentFile(image_content, name=f"product_{index}.jpg"),
                    is_primary=True,
                )

            defaults = {"glb_file_url": item["glb"]}
            defaults.update(item["calibration"])
            GlassesModel.objects.update_or_create(
                product=product,
                defaults=defaults,
            )

    def generate_image(self, rgb):
        image = Image.new("RGB", (1200, 800), rgb)
        buffer = BytesIO()
        image.save(buffer, format="JPEG", quality=90)
        return buffer.getvalue()
