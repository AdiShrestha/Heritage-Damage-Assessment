# TARGET: app/services/report_service.py
from __future__ import annotations

"""
Assessment report generator.

Produces a structured, human-readable report from a PredictionResponse.
Used by:
  - GET /api/v1/report/{request_id}     → retrieve stored report
  - POST /api/v1/predict?report=true    → predict + return inline report

No extra models are needed — everything is derived from what MoE already returns.
"""


import uuid
from datetime import datetime, timezone
from typing import Any

from app.ml.severity_scorer import compute_severity, severity_to_label
from app.utils.constants import CLASS_NAMES, CRITICALITY_MAP


_RECOMMENDATIONS: dict[str, list[str]] = {
    "STABLE": [
        "No immediate action required.",
        "Schedule routine survey in 12 months.",
        "Document current condition as baseline.",
    ],
    "MINOR": [
        "Conduct in-person inspection within 90 days.",
        "Monitor specific damage regions identified in the heatmap.",
        "Consider preventive maintenance to avoid progression.",
        "Update survey records with current severity score.",
    ],
    "MODERATE": [
        "Schedule structural assessment within 30 days.",
        "Restrict public access to affected areas if necessary.",
        "Engage conservation specialists for repair plan.",
        "Prioritise in restoration budget cycle.",
    ],
    "CRITICAL": [
        "IMMEDIATE inspection required — do not delay.",
        "Assess structural stability before allowing any access.",
        "Engage emergency conservation response team.",
        "Document all visible damage with photographs.",
        "Alert heritage authority and local government.",
    ],
    "UNKNOWN": [
        "Manual review required — model confidence was low.",
        "Re-submit with a higher-quality image if possible.",
    ],
}


def generate_report(
    response: Any,  # PredictionResponse
    site_id: str | None = None,
    site_name: str | None = None,
    surveyor: str | None = None,
    notes: str | None = None,
    history_rows: list[dict] | None = None,  # from HistoryService
) -> dict:
    """
    Build a complete assessment report dict from a PredictionResponse.
    All fields are JSON-serialisable.
    """
    criticality = response.criticality or CRITICALITY_MAP.get(
        response.predicted_class, "UNKNOWN"
    )
    probs = {cp.class_name: cp.probability for cp in response.class_probabilities}
    severity = getattr(response, "severity_score", None) or compute_severity(probs)
    sev_label = getattr(response, "severity_label", None) or severity_to_label(severity)
    disagreement = getattr(response, "disagreement_score", None)
    needs_review = getattr(response, "requires_human_review", False)
    gate_weights = response.gate_weights or []
    per_expert = response.per_expert_predictions or []

    # Expert breakdown
    expert_section = (
        [
            {
                "model": e.expert,
                "prediction": e.predicted_class,
                "confidence_pct": round(e.confidence * 100, 1),
                "gate_weight_pct": round(e.gate_weight * 100, 1),
            }
            for e in per_expert
        ]
        if per_expert
        else []
    )

    # Trend from history
    trend_section = None
    if history_rows and len(history_rows) >= 2:
        first = history_rows[-1]
        last = history_rows[0]
        delta = (last.get("severity_score") or 0) - (first.get("severity_score") or 0)
        trend_section = {
            "previous_assessments": len(history_rows),
            "first_assessment": first.get("timestamp"),
            "latest_severity": last.get("severity_score"),
            "severity_delta": round(delta, 4),
            "direction": (
                "deteriorating"
                if delta > 0.05
                else "improving"
                if delta < -0.05
                else "stable"
            ),
            "history": [
                {
                    "timestamp": r.get("timestamp"),
                    "predicted_class": r.get("predicted_class"),
                    "severity_score": r.get("severity_score"),
                    "criticality": r.get("criticality"),
                }
                for r in history_rows[:10]
            ],
        }

    return {
        "report_id": str(uuid.uuid4()),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "request_id": response.request_id,
        # ── Site metadata ─────────────────────────────────────────────────────
        "site": {
            "site_id": site_id,
            "site_name": site_name,
            "surveyor": surveyor,
            "notes": notes,
        },
        # ── Damage assessment ─────────────────────────────────────────────────
        "assessment": {
            "damage_class": response.predicted_class,
            "criticality": criticality,
            "confidence_pct": round(response.confidence * 100, 1),
            "severity_score": round(severity, 4),
            "severity_label": sev_label,
            "class_probabilities": {k: round(v * 100, 1) for k, v in probs.items()},
        },
        # ── Quality flags ─────────────────────────────────────────────────────
        "quality": {
            "model_used": response.model_used,
            "used_gate_routing": response.used_gate,
            "disagreement_score": round(disagreement, 4) if disagreement else None,
            "requires_human_review": needs_review,
            "inference_time_ms": response.inference_time_ms,
        },
        # ── Expert breakdown ──────────────────────────────────────────────────
        "experts": expert_section,
        # ── Trend ─────────────────────────────────────────────────────────────
        "trend": trend_section,
        # ── Recommendations ───────────────────────────────────────────────────
        "recommendations": _RECOMMENDATIONS.get(
            criticality, _RECOMMENDATIONS["UNKNOWN"]
        ),
        # ── Visualisation note ────────────────────────────────────────────────
        "visualization": {
            "gradcam_available": response.gradcam_image_base64 is not None,
            "note": (
                "Damage heatmap with bounding boxes is available in "
                "gradcam_image_base64 of the parent prediction response."
                if response.gradcam_image_base64
                else "No visualization available for this prediction."
            ),
        },
    }
