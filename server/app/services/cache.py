"""
Simple in-memory TTL cache for expensive operations (scraping, LLM calls).
Keeps Render free-tier fast by avoiding repeated work.
"""
from __future__ import annotations

import hashlib
import json
import time
from typing import Any, Optional

_store: dict[str, tuple[float, Any]] = {}

DEFAULT_TTL = 1800  # 30 minutes


def _make_key(prefix: str, data: dict) -> str:
    raw = json.dumps(data, sort_keys=True, default=str)
    h = hashlib.md5(raw.encode()).hexdigest()
    return f"{prefix}:{h}"


def get(prefix: str, params: dict) -> Optional[Any]:
    key = _make_key(prefix, params)
    entry = _store.get(key)
    if entry is None:
        return None
    expires, value = entry
    if time.time() > expires:
        _store.pop(key, None)
        return None
    return value


def put(prefix: str, params: dict, value: Any, ttl: int = DEFAULT_TTL):
    key = _make_key(prefix, params)
    _store[key] = (time.time() + ttl, value)


def clear():
    _store.clear()


def stats() -> dict:
    now = time.time()
    total = len(_store)
    alive = sum(1 for _, (exp, _) in _store.items() if exp > now)
    return {"total_entries": total, "alive": alive, "expired": total - alive}
