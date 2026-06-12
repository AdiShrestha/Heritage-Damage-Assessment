# TARGET: app/services/history_service.py
from __future__ import annotations

"""
Async SQLite prediction history store.

Every completed prediction is written here. Supports:
  - per-site history queries
  - date-range filtering
  - criticality distribution
  - severity trend over time (for the temporal comparison feature)

Uses aiosqlite so it never blocks the FastAPI event loop.
DB path is configured via settings.HISTORY_DB_PATH.
"""


import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.core.logging import get_logger

logger = get_logger(__name__)

_DDL = """
CREATE TABLE IF NOT EXISTS predictions (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id       TEXT    NOT NULL,
    site_id          TEXT,
    timestamp        TEXT    NOT NULL,
    model_used       TEXT    NOT NULL,
    image_hash       TEXT,
    predicted_class  TEXT    NOT NULL,
    confidence       REAL    NOT NULL,
    criticality      TEXT,
    severity_score   REAL,
    severity_label   TEXT,
    disagreement     REAL,
    requires_review  INTEGER DEFAULT 0,
    inference_ms     REAL,
    gate_weights     TEXT,
    per_expert       TEXT,
    used_gate        INTEGER
);

CREATE INDEX IF NOT EXISTS idx_site      ON predictions(site_id);
CREATE INDEX IF NOT EXISTS idx_ts        ON predictions(timestamp);
CREATE INDEX IF NOT EXISTS idx_crit      ON predictions(criticality);
CREATE INDEX IF NOT EXISTS idx_review    ON predictions(requires_review);
"""


class HistoryService:
    def __init__(self, db_path: Path) -> None:
        self._db_path = db_path
        self._ready = False

    async def init(self) -> None:
        """Create DB and tables if they don't exist. Call once at startup."""
        try:
            import aiosqlite

            self._db_path.parent.mkdir(parents=True, exist_ok=True)
            async with aiosqlite.connect(self._db_path) as db:
                await db.executescript(_DDL)
                await db.commit()
            self._ready = True
            logger.info("History DB ready at %s", self._db_path)
        except ImportError:
            logger.warning("aiosqlite not installed — prediction history disabled.")
        except Exception as e:
            logger.error("History DB init failed: %s", e)

    # ── Write ─────────────────────────────────────────────────────────────────

    async def record(
        self,
        response: Any,  # PredictionResponse
        site_id: str | None = None,
        image_bytes: bytes | None = None,
    ) -> None:
        """Persist one prediction. Silently skips if DB unavailable."""
        if not self._ready:
            return
        try:
            import aiosqlite

            image_hash = (
                hashlib.sha256(image_bytes).hexdigest() if image_bytes else None
            )

            row = {
                "request_id": response.request_id,
                "site_id": site_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "model_used": response.model_used,
                "image_hash": image_hash,
                "predicted_class": response.predicted_class,
                "confidence": response.confidence,
                "criticality": response.criticality,
                "severity_score": getattr(response, "severity_score", None),
                "severity_label": getattr(response, "severity_label", None),
                "disagreement": getattr(response, "disagreement_score", None),
                "requires_review": int(
                    getattr(response, "requires_human_review", False)
                ),
                "inference_ms": response.inference_time_ms,
                "gate_weights": json.dumps(response.gate_weights)
                if response.gate_weights
                else None,
                "per_expert": json.dumps(
                    [
                        {
                            "expert": e.expert,
                            "class": e.predicted_class,
                            "conf": e.confidence,
                        }
                        for e in (response.per_expert_predictions or [])
                    ]
                )
                if response.per_expert_predictions
                else None,
                "used_gate": int(response.used_gate)
                if response.used_gate is not None
                else None,
            }

            async with aiosqlite.connect(self._db_path) as db:
                await db.execute(
                    """INSERT INTO predictions
                       (request_id, site_id, timestamp, model_used, image_hash,
                        predicted_class, confidence, criticality, severity_score,
                        severity_label, disagreement, requires_review, inference_ms,
                        gate_weights, per_expert, used_gate)
                       VALUES
                       (:request_id, :site_id, :timestamp, :model_used, :image_hash,
                        :predicted_class, :confidence, :criticality, :severity_score,
                        :severity_label, :disagreement, :requires_review, :inference_ms,
                        :gate_weights, :per_expert, :used_gate)""",
                    row,
                )
                await db.commit()
        except Exception as e:
            logger.warning("History write failed: %s", e)

    # ── Read ──────────────────────────────────────────────────────────────────

    async def get_site_history(
        self,
        site_id: str,
        limit: int = 50,
        since: str | None = None,  # ISO timestamp
    ) -> list[dict]:
        """All predictions for one site, newest first."""
        if not self._ready:
            return []
        try:
            import aiosqlite

            q = (
                "SELECT * FROM predictions WHERE site_id = ? "
                + ("AND timestamp >= ? " if since else "")
                + "ORDER BY timestamp DESC LIMIT ?"
            )
            params = (site_id, since, limit) if since else (site_id, limit)
            async with aiosqlite.connect(self._db_path) as db:
                db.row_factory = aiosqlite.Row
                async with db.execute(q, params) as cur:
                    rows = await cur.fetchall()
            return [dict(r) for r in rows]
        except Exception as e:
            logger.warning("History query failed: %s", e)
            return []

    async def get_severity_trend(self, site_id: str, limit: int = 20) -> list[dict]:
        """Severity score over time for a site — ready to plot."""
        rows = await self.get_site_history(site_id, limit=limit)
        return [
            {
                "timestamp": r["timestamp"],
                "severity_score": r["severity_score"],
                "criticality": r["criticality"],
                "predicted_class": r["predicted_class"],
            }
            for r in rows
            if r.get("severity_score") is not None
        ]

    async def get_flagged(self, limit: int = 100) -> list[dict]:
        """Predictions flagged for human review, newest first."""
        if not self._ready:
            return []
        try:
            import aiosqlite

            async with aiosqlite.connect(self._db_path) as db:
                db.row_factory = aiosqlite.Row
                async with db.execute(
                    "SELECT * FROM predictions WHERE requires_review = 1 "
                    "ORDER BY timestamp DESC LIMIT ?",
                    (limit,),
                ) as cur:
                    rows = await cur.fetchall()
            return [dict(r) for r in rows]
        except Exception as e:
            logger.warning("Flagged query failed: %s", e)
            return []

    async def criticality_distribution(
        self, site_id: str | None = None
    ) -> dict[str, int]:
        """Count of each criticality grade, optionally filtered to one site."""
        if not self._ready:
            return {}
        try:
            import aiosqlite

            if site_id:
                q = (
                    "SELECT criticality, COUNT(*) as n FROM predictions "
                    "WHERE site_id = ? GROUP BY criticality"
                )
                params = (site_id,)
            else:
                q = "SELECT criticality, COUNT(*) as n FROM predictions GROUP BY criticality"
                params = ()
            async with aiosqlite.connect(self._db_path) as db:
                db.row_factory = aiosqlite.Row
                async with db.execute(q, params) as cur:
                    rows = await cur.fetchall()
            return {r["criticality"]: r["n"] for r in rows if r["criticality"]}
        except Exception as e:
            logger.warning("Distribution query failed: %s", e)
            return {}

    async def stats(self) -> dict:
        """High-level stats for the metrics endpoint."""
        if not self._ready:
            return {"available": False}
        try:
            import aiosqlite

            async with aiosqlite.connect(self._db_path) as db:
                db.row_factory = aiosqlite.Row
                async with db.execute(
                    "SELECT COUNT(*) as total, "
                    "AVG(confidence) as avg_conf, "
                    "AVG(severity_score) as avg_sev, "
                    "AVG(inference_ms) as avg_ms, "
                    "SUM(requires_review) as flagged "
                    "FROM predictions"
                ) as cur:
                    row = dict(await cur.fetchone())
            row["available"] = True
            return row
        except Exception as e:
            logger.warning("Stats query failed: %s", e)
            return {"available": False}


# Singleton injected into app state at startup
history_service: HistoryService | None = None


def get_history_service() -> HistoryService:
    if history_service is None:
        raise RuntimeError("HistoryService not initialised — check app startup.")
    return history_service
