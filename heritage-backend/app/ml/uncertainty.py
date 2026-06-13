# TARGET: app/ml/uncertainty.py
from __future__ import annotations

"""
Monte Carlo Dropout uncertainty quantification.

Runs N stochastic forward passes with dropout layers kept ACTIVE at inference.
Returns:
  - mean predicted class (most common across passes)
  - epistemic_uncertainty: std-dev of class probabilities across passes
  - predictive_entropy: H(p̄) — entropy of the mean distribution
  - expert_agreement: fraction of passes where all experts agree on class
  - uncertain_flag: True if uncertainty exceeds threshold

Usage:
    from app.ml.uncertainty import UncertaintyEstimator
    estimator = UncertaintyEstimator(moe_model, n_passes=15)
    result = estimator.estimate(tensor)
"""

import math
from typing import Any

from app.core.logging import get_logger
from app.utils.constants import CLASS_NAMES, NUM_CLASSES

logger = get_logger(__name__)

# Flag as uncertain if predictive entropy > this threshold
_ENTROPY_THRESHOLD = 0.60  # nats; max entropy for 3 classes ≈ 1.10


def _enable_dropout(module: Any) -> None:
    """Set all Dropout layers to train mode so they fire at inference."""
    for m in module.modules():
        if m.__class__.__name__.startswith("Dropout"):
            m.train()


def _predictive_entropy(mean_probs: list[float]) -> float:
    """H(p̄) = -sum(p̄ * log(p̄ + ε))"""
    eps = 1e-8
    return float(-sum(p * math.log(p + eps) for p in mean_probs))


class UncertaintyEstimator:
    """Wraps a loaded MoEPredictor and runs MC Dropout inference."""

    def __init__(
        self,
        moe_model: Any,
        n_passes: int = 15,
        entropy_threshold: float = _ENTROPY_THRESHOLD,
    ) -> None:
        self._moe = moe_model
        self._n_passes = n_passes
        self._entropy_threshold = entropy_threshold

    def estimate(self, tensor: Any) -> dict:
        """
        Args:
            tensor: preprocessed input tensor [1, 3, 224, 224] on correct device.
        Returns dict with keys:
            predicted_class, confidence, class_probabilities,
            epistemic_std, predictive_entropy, uncertain_flag,
            expert_agreement_rate, per_pass_predictions
        """
        try:
            import torch
            import torch.nn.functional as F
            import numpy as np
        except ImportError:
            logger.error("PyTorch not available for uncertainty estimation.")
            return {}

        if self._moe._moe is None:
            logger.warning("MoE not loaded; skipping uncertainty estimation.")
            return {}

        moe_nn = self._moe._moe
        # Keep experts' feature extractors in eval but enable dropout heads
        moe_nn.eval()
        _enable_dropout(moe_nn)

        all_probs: list[list[float]] = []  # [n_passes, n_classes]
        all_expert_preds: list[list[int]] = []  # [n_passes, n_experts]

        with torch.no_grad():
            for _ in range(self._n_passes):
                fused, gate_w, expert_logits = moe_nn(tensor)
                probs = F.softmax(fused, dim=1)[0].cpu().tolist()
                all_probs.append(probs)

                ep = []
                for logits in expert_logits:
                    ep.append(int(F.softmax(logits, dim=1)[0].argmax()))
                all_expert_preds.append(ep)

        # Restore eval mode
        moe_nn.eval()

        probs_np = np.array(all_probs)  # [n_passes, n_classes]
        mean_probs = probs_np.mean(axis=0).tolist()
        std_probs = probs_np.std(axis=0).tolist()

        pred_idx = int(np.argmax(mean_probs))
        entropy = _predictive_entropy(mean_probs)
        uncertain = entropy > self._entropy_threshold

        # Expert agreement: fraction of passes where all experts picked same class
        agreement_count = sum(
            1 for pass_preds in all_expert_preds if len(set(pass_preds)) == 1
        )
        agreement_rate = round(agreement_count / self._n_passes, 3)

        return {
            "predicted_class": CLASS_NAMES[pred_idx],
            "confidence": round(float(mean_probs[pred_idx]), 4),
            "class_probabilities": {
                CLASS_NAMES[i]: round(float(p), 4) for i, p in enumerate(mean_probs)
            },
            "epistemic_std": round(float(max(std_probs)), 4),
            "predictive_entropy": round(entropy, 4),
            "uncertain_flag": uncertain,
            "expert_agreement_rate": agreement_rate,
            "n_passes": self._n_passes,
        }
