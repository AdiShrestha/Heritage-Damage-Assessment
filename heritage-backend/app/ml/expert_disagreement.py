# TARGET: app/ml/expert_disagreement.py
from __future__ import annotations

"""
Expert disagreement analysis.

After MoE inference, measures how much the four experts disagreed.
High disagreement = uncertain image that should be flagged for human review.

Three signals:
  1. vote_entropy     — Shannon entropy of the expert vote distribution (0 = all agree)
  2. confidence_spread — max(expert_conf) - min(expert_conf)
  3. majority_conflict — True if majority expert vote != gate-weighted prediction

Combined into a single disagreement_score in [0, 1].
"""


import math
from app.utils.constants import CLASS_NAMES

_N_CLASSES = len(CLASS_NAMES)
_MAX_ENTROPY = math.log(_N_CLASSES)  # upper bound for normalisation
_REVIEW_SCORE = 0.55  # flag for human review above this


def compute_disagreement(
    per_expert: list[dict],
    predicted_class: str,
) -> dict:
    """
    Args:
        per_expert: list of dicts from MoEPredictor.predict()
                    Each: {expert, class, confidence, gate_weight}
        predicted_class: the gate-fused final prediction

    Returns dict:
        disagreement_score   float [0, 1]
        vote_entropy         float
        confidence_spread    float
        majority_conflict    bool
        requires_human_review bool
        expert_votes         {class_name: count}
    """
    if not per_expert:
        return {
            "disagreement_score": 0.0,
            "vote_entropy": 0.0,
            "confidence_spread": 0.0,
            "majority_conflict": False,
            "requires_human_review": False,
            "expert_votes": {},
        }

    votes: dict[str, int] = {}
    confs: list[float] = []

    for ep in per_expert:
        cls = ep["class"]
        conf = ep["confidence"]
        votes[cls] = votes.get(cls, 0) + 1
        confs.append(conf)

    n = len(per_expert)

    # 1. Vote entropy
    entropy = 0.0
    for count in votes.values():
        p = count / n
        entropy -= p * math.log(p + 1e-9)
    norm_entropy = entropy / (_MAX_ENTROPY + 1e-9)  # [0, 1]

    # 2. Confidence spread
    conf_spread = round(max(confs) - min(confs), 4)

    # 3. Majority conflict
    majority_class = max(votes, key=votes.get)
    majority_conflict = majority_class != predicted_class

    # Combined score — weighted mix
    disagreement_score = round(
        0.55 * norm_entropy + 0.30 * conf_spread + 0.15 * float(majority_conflict),
        4,
    )

    return {
        "disagreement_score": disagreement_score,
        "vote_entropy": round(norm_entropy, 4),
        "confidence_spread": conf_spread,
        "majority_conflict": majority_conflict,
        "requires_human_review": disagreement_score >= _REVIEW_SCORE,
        "expert_votes": votes,
    }
