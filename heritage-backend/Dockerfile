# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Stage 1 — builder
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# INSTALL_ML=true  → full ML stack (torch + torchvision + timm + ultralytics + torch-ema)
# INSTALL_ML=false → API-only (mock predictor only, no GPU deps)
ARG INSTALL_ML=true

WORKDIR /build

# Install uv for fast dependency resolution
RUN pip install --no-cache-dir uv


COPY pyproject.toml .
# README.md is referenced by pyproject.toml; copy it so hatchling wheel builds succeed.
COPY README.md* ./

# Create a dummy app structure to trick hatchling into installing dependencies
# without needing the full source code (preserves Docker cache for heavy ML deps).
RUN mkdir -p app && touch app/__init__.py

# ── Install Python dependencies ───────────────────────────────────────────────
RUN if [ "$INSTALL_ML" = "true" ]; then \
        uv pip install --system --no-cache \
            ".[inference,detection,explainability]"; \
    else \
        uv pip install --system --no-cache .; \
    fi

# Now copy the actual application code
COPY app/ app/

# Reinstall just the project itself (without dependencies) to update metadata
RUN uv pip install --system --no-cache --no-deps .


RUN uv pip uninstall --system opencv-python opencv-contrib-python 2>/dev/null || true && \
    uv pip install --system --no-cache opencv-python-headless


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Stage 2 — runtime
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    # Number of uvicorn workers.
    # Keep at 1 when sharing GPU memory — multiple workers each load full model weights.
    WORKERS=1

# ── Non-root user ─────────────────────────────────────────────────────────────
RUN useradd --create-home --shell /bin/bash appuser

# ── Copy installed packages from builder ─────────────────────────────────────
COPY --from=builder /usr/local/lib/python3.12/site-packages \
                    /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# ── App source ────────────────────────────────────────────────────────────────
WORKDIR /app
COPY ./app ./app

# ── Runtime directories ───────────────────────────────────────────────────────
# weights/ — mount your .pth files here at runtime (see docker-compose.yml)
# data/    — SQLite history DB written here by history_service.py
RUN mkdir -p weights data && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

# ── Health check ──────────────────────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=3 \
    CMD python -c \
        "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health/ready')"

# ── Entry point ───────────────────────────────────────────────────────────────
CMD ["sh", "-c", \
     "uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers ${WORKERS}"]