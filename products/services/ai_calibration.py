import json
from dataclasses import dataclass
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings

from products.models import GlassesModel


@dataclass
class CalibrationResult:
    ok: bool
    source: str
    values: dict | None = None
    error: str = ""


def auto_calibrate_glasses_model(glasses_model: GlassesModel) -> CalibrationResult:
    endpoint = getattr(settings, "AI_CALIBRATOR_URL", "").strip()

    if endpoint:
        ai_result = _calibrate_with_ai_endpoint(glasses_model, endpoint)
        if ai_result.ok:
            return ai_result

    fallback_values = _fallback_calibration(glasses_model)
    return CalibrationResult(ok=True, source=GlassesModel.CalibrationSource.FALLBACK, values=fallback_values)


def _calibrate_with_ai_endpoint(glasses_model: GlassesModel, endpoint: str) -> CalibrationResult:
    payload = {
        "product": {
            "id": glasses_model.product_id,
            "name": glasses_model.product.name,
            "category": glasses_model.product.category.name if glasses_model.product.category else None,
            "frame_shape": glasses_model.product.frame_shape.name if glasses_model.product.frame_shape else None,
            "gender": glasses_model.product.gender,
        },
        "glb_file_url": glasses_model.glb_file_url,
        "current_calibration": {
            "scale": glasses_model.scale,
            "position_x": glasses_model.position_x,
            "position_y": glasses_model.position_y,
            "position_z": glasses_model.position_z,
            "rotation_x": glasses_model.rotation_x,
            "rotation_y": glasses_model.rotation_y,
            "rotation_z": glasses_model.rotation_z,
        },
    }

    data = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}

    api_key = getattr(settings, "AI_CALIBRATOR_API_KEY", "").strip()
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    request = Request(url=endpoint, data=data, headers=headers, method="POST")

    try:
        with urlopen(request, timeout=20) as response:
            body = response.read().decode("utf-8")
        parsed = json.loads(body)
    except HTTPError as exc:
        return CalibrationResult(ok=False, source=GlassesModel.CalibrationSource.AI, error=f"AI endpoint HTTP {exc.code}")
    except URLError:
        return CalibrationResult(ok=False, source=GlassesModel.CalibrationSource.AI, error="AI endpoint unreachable")
    except (TimeoutError, json.JSONDecodeError):
        return CalibrationResult(ok=False, source=GlassesModel.CalibrationSource.AI, error="AI endpoint invalid response")

    calibration = parsed.get("calibration", parsed)
    required = {
        "scale",
        "position_x",
        "position_y",
        "position_z",
        "rotation_x",
        "rotation_y",
        "rotation_z",
    }

    if not isinstance(calibration, dict) or not required.issubset(calibration.keys()):
        return CalibrationResult(
            ok=False,
            source=GlassesModel.CalibrationSource.AI,
            error="AI response missing calibration fields",
        )

    try:
        normalized = {field: float(calibration[field]) for field in required}
    except (TypeError, ValueError):
        return CalibrationResult(
            ok=False,
            source=GlassesModel.CalibrationSource.AI,
            error="AI response has invalid calibration values",
        )

    return CalibrationResult(ok=True, source=GlassesModel.CalibrationSource.AI, values=normalized)


def _fallback_calibration(glasses_model: GlassesModel) -> dict:
    base = {
        "scale": 0.88,
        "position_x": 0.0,
        "position_y": 0.01,
        "position_z": -0.05,
        "rotation_x": 0.0,
        "rotation_y": 0.0,
        "rotation_z": 0.0,
    }

    shape_name = (glasses_model.product.frame_shape.name if glasses_model.product.frame_shape else "").lower()

    shape_overrides = {
        "rectangle": {"scale": 0.84, "position_y": 0.012, "position_z": -0.055},
        "round": {"scale": 0.86, "position_y": 0.010, "position_z": -0.052},
        "cat eye": {"scale": 0.87, "position_y": 0.014, "position_z": -0.055},
        "aviator": {"scale": 0.90, "position_y": 0.016, "position_z": -0.060},
    }

    for key, overrides in shape_overrides.items():
        if key in shape_name:
            base.update(overrides)
            break

    category_name = (glasses_model.product.category.name if glasses_model.product.category else "").lower()
    if "reading" in category_name:
        base["scale"] *= 0.96
    if "sunglasses" in category_name:
        base["scale"] *= 1.03

    return base


def apply_calibration(glasses_model: GlassesModel, result: CalibrationResult) -> GlassesModel:
    if result.ok and result.values:
        for field, value in result.values.items():
            setattr(glasses_model, field, value)
        glasses_model.calibration_status = GlassesModel.CalibrationStatus.SUCCESS
        glasses_model.calibration_source = result.source
        glasses_model.calibration_error = ""
    else:
        glasses_model.calibration_status = GlassesModel.CalibrationStatus.FAILED
        glasses_model.calibration_source = result.source
        glasses_model.calibration_error = result.error or "Calibration failed"

    glasses_model.last_calibrated_at = datetime.now(timezone.utc)
    glasses_model.save()
    return glasses_model
