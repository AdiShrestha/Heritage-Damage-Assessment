# TARGET: app/services/cache_service.py
from __future__ import annotations

"""
SHA-256–keyed in-memory prediction cache with TTL.

Avoids re-running MoE inference on identical image bytes.
On a T4 GPU each MoE pass takes ~120-300 ms; cache hits return in <1 ms.

Usage:
    cache = PredictionCache(ttl_seconds=3600)
    hit = cache.get(image_bytes, model_name)
    if hit is None:
        result = await service.run_prediction(...)
        cache.set(image_bytes, model_name, result)
"""


import hashlib
import time
from dataclasses import dataclass, field
from typing import Any

from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class _CacheEntry:
    result: Any
    created_at: float = field(default_factory=time.monotonic)


class PredictionCache:
    """Thread-safe (GIL-protected) TTL cache for prediction results."""

    def __init__(self, ttl_seconds: float = 3600, max_entries: int = 512) -> None:
        self._ttl = ttl_seconds
        self._max_entries = max_entries
        self._store: dict[str, _CacheEntry] = {}

    @staticmethod
    def _key(image_bytes: bytes, model_name: str) -> str:
        digest = hashlib.sha256(image_bytes).hexdigest()
        return f"{model_name}:{digest}"

    def get(self, image_bytes: bytes, model_name: str) -> Any | None:
        key = self._key(image_bytes, model_name)
        entry = self._store.get(key)
        if entry is None:
            return None
        if time.monotonic() - entry.created_at > self._ttl:
            del self._store[key]
            logger.debug("Cache expired for key %s…", key[:16])
            return None
        logger.debug("Cache hit for key %s…", key[:16])
        return entry.result

    def set(self, image_bytes: bytes, model_name: str, result: Any) -> None:
        key = self._key(image_bytes, model_name)
        if len(self._store) >= self._max_entries:
            self._evict_oldest()
        self._store[key] = _CacheEntry(result=result)
        logger.debug("Cached result for key %s…", key[:16])

    def _evict_oldest(self) -> None:
        if not self._store:
            return
        oldest = min(self._store, key=lambda k: self._store[k].created_at)
        del self._store[oldest]
        logger.debug("Evicted oldest cache entry %s…", oldest[:16])

    def invalidate(self, model_name: str | None = None) -> int:
        """Clear entries for a specific model, or all entries if model_name is None."""
        if model_name is None:
            n = len(self._store)
            self._store.clear()
            return n
        keys = [k for k in self._store if k.startswith(f"{model_name}:")]
        for k in keys:
            del self._store[k]
        return len(keys)

    def stats(self) -> dict:
        now = time.monotonic()
        alive = sum(1 for e in self._store.values() if now - e.created_at <= self._ttl)
        return {
            "total_entries": len(self._store),
            "live_entries": alive,
            "expired_entries": len(self._store) - alive,
            "ttl_seconds": self._ttl,
            "max_entries": self._max_entries,
        }


# Module-level singleton — imported by prediction_service and batch_service
prediction_cache = PredictionCache()
