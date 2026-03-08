from django.db import migrations, models


def migrate_ai_to_fallback(apps, schema_editor):
    GlassesModel = apps.get_model("products", "GlassesModel")
    GlassesModel.objects.filter(calibration_source="ai").update(calibration_source="fallback")


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0004_glassesmodel_calibration_error_and_more"),
    ]

    operations = [
        migrations.RunPython(migrate_ai_to_fallback, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="glassesmodel",
            name="calibration_source",
            field=models.CharField(
                choices=[("manual", "Manual"), ("fallback", "Fallback")],
                default="manual",
                max_length=20,
            ),
        ),
    ]
