# TARGET: app/ml/severity_scorer.py
from __future__ import annotations

"""
Continuous severity score derived from MoE class probabilities.

Maps the 3-class softmax distribution onto a single 0.0–1.0 score
using class-anchored linear interpolation:
  Undamaged    → 0.00
  Partial Damage → 0.50
  Damaged      → 1.00

Expected value: severity = 0*p0 + 0.5*p1 + 1.0*p2
"""

from app.utils.constants import CLASS_NAMES

# Anchor weights per class — edit if you add classes
_CLASS_SEVERITY: dict[str, float] = {
    "Undamaged": 0.00,
    "Partial Damage": 0.50,
    "Damaged": 1.00,
}

_SEVERITY_ANCHORS: list[float] = [_CLASS_SEVERITY[c] for c in CLASS_NAMES]


def compute_severity(class_probabilities: dict[str, float]) -> float:
    """
    Args:
        class_probabilities: {class_name: probability} from PredictionResult.
    Returns:
        float in [0.0, 1.0]
    """
    score = 0.0
    for cls, anchor in zip(CLASS_NAMES, _SEVERITY_ANCHORS):
        score += class_probabilities.get(cls, 0.0) * anchor
    return round(float(score), 4)


def severity_to_label(severity: float) -> str:
    """Map continuous score to a human label for the UI."""
    if severity < 0.20:
        return "MINIMAL"
    if severity < 0.45:
        return "LOW"
    if severity < 0.65:
        return "MODERATE"
    if severity < 0.85:
        return "HIGH"
    return "CRITICAL"


def batch_severity(results: list[dict]) -> list[dict]:
    """
    Attach severity_score and severity_label to a list of result dicts.
    Mutates in place and returns sorted by severity descending (priority queue).
    """
    for r in results:
        r["severity_score"] = compute_severity(r.get("class_probabilities", {}))
        r["severity_label"] = severity_to_label(r["severity_score"])
    return sorted(results, key=lambda x: x["severity_score"], reverse=True)
