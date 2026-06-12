# TARGET: app/ml/temporal_comparator.py
from __future__ import annotations

"""
Temporal change detection via ViT CLS-token embeddings.

Given two images of the same heritage site taken at different times,
computes:
  - cosine similarity of ViT CLS embeddings
  - severity delta (severity_t2 - severity_t1)
  - change_detected flag
  - change_label: STABLE / DETERIORATING / IMPROVING / SIGNIFICANT_CHANGE

Architecture note:
  Uses the ViT expert inside the loaded MoEPredictor — no extra model needed.
  The CLS token is a rich 768-dim structural feature embedding ideal for
  comparing the same scene across surveys.
"""


from typing import Any

from app.core.logging import get_logger
from app.ml.severity_scorer import compute_severity, severity_to_label
from app.utils.constants import CLASS_NAMES

logger = get_logger(__name__)

_CHANGE_THRESHOLD = 0.08  # cosine distance above this → change detected
_SEVERITY_DELTA_MINOR = 0.10  # delta above this → noteworthy
_SEVERITY_DELTA_MAJOR = 0.30  # delta above this → significant


def _preprocess_to_tensor(image: Any, device: str) -> Any:
    import numpy as np
    import torch

    pil = image.convert("RGB").resize((224, 224))
    arr = np.array(pil).astype(np.float32) / 255.0
    arr = (arr - np.array([0.485, 0.456, 0.406])) / np.array([0.229, 0.224, 0.225])
    return torch.from_numpy(arr.transpose(2, 0, 1)).unsqueeze(0).float().to(device)


def _cosine_similarity(a: Any, b: Any) -> float:
    import torch
    import torch.nn.functional as F

    return float(F.cosine_similarity(a, b, dim=-1).item())


def _extract_vit_embedding(moe_model: Any, tensor: Any) -> Any:
    """Pull CLS token from the ViT expert inside the MoE."""
    import torch

    vit_expert = None
    for extractor in moe_model._moe.extractors:
        if hasattr(extractor.model, "blocks"):  # timm ViT
            vit_expert = extractor.model
            break

    if vit_expert is None:
        raise RuntimeError("ViT expert not found in MoE — cannot extract embeddings.")

    vit_expert.eval()
    with torch.no_grad():
        feats = vit_expert.forward_features(tensor)
        cls = feats[:, 0] if feats.dim() == 3 else feats  # [1, 768]
    return cls


def _moe_class_probs(moe_model: Any, tensor: Any) -> dict[str, float]:
    import torch
    import torch.nn.functional as F

    moe_model._moe.eval()
    with torch.no_grad():
        fused, _, _ = moe_model._moe(tensor)
    probs = F.softmax(fused, dim=1)[0].cpu().tolist()
    return {CLASS_NAMES[i]: float(p) for i, p in enumerate(probs)}


def _change_label(cosine_dist: float, severity_delta: float) -> str:
    if cosine_dist < _CHANGE_THRESHOLD:
        return "STABLE"
    if abs(severity_delta) < _SEVERITY_DELTA_MINOR:
        return "STABLE"
    if severity_delta >= _SEVERITY_DELTA_MAJOR:
        return "SIGNIFICANT_DETERIORATION"
    if severity_delta > 0:
        return "DETERIORATING"
    if severity_delta <= -_SEVERITY_DELTA_MAJOR:
        return "SIGNIFICANT_IMPROVEMENT"
    return "IMPROVING"


class TemporalComparator:
    """Compare two images of the same site to detect deterioration."""

    def __init__(self, moe_predictor: Any) -> None:
        self._predictor = moe_predictor

    def compare(self, image_t1: Any, image_t2: Any, site_id: str | None = None) -> dict:
        """
        Args:
            image_t1: PIL image — earlier survey
            image_t2: PIL image — later survey
            site_id:  optional identifier passed through to response
        Returns:
            Full comparison dict suitable for ComparisonResponse schema
        """
        if not self._predictor.is_loaded():
            raise RuntimeError("MoE predictor not loaded.")

        device = self._predictor._device

        t1 = _preprocess_to_tensor(image_t1, device)
        t2 = _preprocess_to_tensor(image_t2, device)

        # Embeddings
        emb_t1 = _extract_vit_embedding(self._predictor, t1)
        emb_t2 = _extract_vit_embedding(self._predictor, t2)

        cosine_sim = _cosine_similarity(emb_t1, emb_t2)
        cosine_dist = round(1.0 - cosine_sim, 4)

        # Class probabilities → severity scores
        probs_t1 = _moe_class_probs(self._predictor, t1)
        probs_t2 = _moe_class_probs(self._predictor, t2)

        sev_t1 = compute_severity(probs_t1)
        sev_t2 = compute_severity(probs_t2)
        delta = round(sev_t2 - sev_t1, 4)

        change_detected = cosine_dist >= _CHANGE_THRESHOLD
        label = _change_label(cosine_dist, delta)

        # Predicted classes
        pred_t1 = CLASS_NAMES[
            max(range(len(CLASS_NAMES)), key=lambda i: probs_t1[CLASS_NAMES[i]])
        ]
        pred_t2 = CLASS_NAMES[
            max(range(len(CLASS_NAMES)), key=lambda i: probs_t2[CLASS_NAMES[i]])
        ]

        return {
            "site_id": site_id,
            "change_detected": change_detected,
            "change_label": label,
            "cosine_distance": cosine_dist,
            "severity_t1": sev_t1,
            "severity_t2": sev_t2,
            "severity_delta": delta,
            "severity_label_t1": severity_to_label(sev_t1),
            "severity_label_t2": severity_to_label(sev_t2),
            "predicted_class_t1": pred_t1,
            "predicted_class_t2": pred_t2,
            "class_probs_t1": probs_t1,
            "class_probs_t2": probs_t2,
            "embedding_dim": int(emb_t1.shape[-1]),
            "recommendation": (
                "Immediate inspection required."
                if label == "SIGNIFICANT_DETERIORATION"
                else "Schedule inspection."
                if label == "DETERIORATING"
                else "Monitor on next survey cycle."
                if label == "STABLE"
                else "Restoration appears effective."
            ),
        }
