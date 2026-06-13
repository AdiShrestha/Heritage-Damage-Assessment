.PHONY: help init install install-dev install-full start stop restart logs clean test lint format check

# ── Config ────────────────────────────────────────────────────────────────────
APP       := heritage-backend
ENTRY     := uvicorn app.main:app
HOST      := 0.0.0.0
PORT      := 8000
WORKERS   := 1
PYTHON    := python3
UV        := uv

# ── Default target ────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  $(APP)"
	@echo ""
	@echo "  make init          — first-time setup (venv + core deps)"
	@echo "  make install       — install core deps only (lean)"
	@echo "  make install-dev   — install core + dev deps"
	@echo "  make install-full  — install everything (detection + explainability)"
	@echo ""
	@echo "  make start         — start API server"
	@echo "  make start-reload  — start with hot reload (dev)"
	@echo "  make stop          — kill the running server"
	@echo "  make restart       — stop + start"
	@echo "  make logs          — tail the log file"
	@echo ""
	@echo "  make test          — run test suite"
	@echo "  make lint          — check code style"
	@echo "  make format        — auto-format code"
	@echo "  make check         — lint + test"
	@echo "  make clean         — remove venv, cache, build artefacts"
	@echo ""

# ── Init (first-time) ─────────────────────────────────────────────────────────
init: _check-uv _venv install
	@echo ""
	@echo "   $(APP) ready"
	@echo "     Run:  make start"
	@echo ""

_check-uv:
	@command -v $(UV) >/dev/null 2>&1 || \
		(echo "    uv not found — installing ..." && \
		curl -Ls https://astral.sh/uv/install.sh | sh && \
		echo "   uv installed")

_venv:
	@if [ ! -d ".venv" ]; then \
		echo "    Creating virtual environment ..."; \
		$(UV) venv .venv; \
		echo "   .venv created"; \
	else \
		echo "   .venv already exists"; \
	fi

# ── Install targets ───────────────────────────────────────────────────────────
install: _venv
	@echo "    Installing core dependencies ..."
	@$(UV) pip install -e . --quiet
	@echo "   Core deps installed"

install-dev: _venv
	@echo "    Installing core + dev dependencies ..."
	@$(UV) pip install -e ".[dev]" --quiet
	@echo "   Dev deps installed"

install-inference: _venv
	@echo "    Installing inference extras (torch/torchvision) ..."
	@$(UV) pip install -e ".[inference]" --quiet
	@echo "   Inference deps installed"

install-explainability: _venv
	@echo "    Installing explainability extras (grad-cam / torch-ema) ..."
	@$(UV) pip install -e ".[inference,explainability]" --quiet
	@echo "   Explainability deps installed"

install-detection: _venv
	@echo "    Installing detection extras (ultralytics / YOLO) ..."
	@$(UV) pip install -e ".[detection]" --quiet
	@echo "   Detection deps installed"

install-full: _venv
	@echo "  Installing all extras ..."
	@$(UV) pip install -e ".[all]" --quiet
	@echo "  All deps installed"

# ── Server ────────────────────────────────────────────────────────────────────
start: _venv
	@echo "  Starting $(APP) on http://$(HOST):$(PORT) ..."
	@mkdir -p logs
	@docker compose up

start-reload: _venv
	@echo "  Starting $(APP) with hot reload ..."
	@mkdir -p logs
	@docker compose down && docker compose up --build

stop:
	@echo "  Stopping $(APP) ..."
	@pkill -f "$(ENTRY)" && echo "   Stopped" || echo "  No running server found"

restart: stop start

logs:
	@tail -f logs/server.log

# ── Quality ───────────────────────────────────────────────────────────────────
test: install-dev
	@echo "  Running tests ..."
	@.venv/bin/pytest tests/ -v --tb=short

lint: install-dev
	@echo "  Linting ..."
	@.venv/bin/ruff check .

format: install-dev
	@echo "   Formatting ..."
	@.venv/bin/ruff format .

check: lint test

# ── Clean ─────────────────────────────────────────────────────────────────────
clean:
	@echo " Cleaning ..."
	@rm -rf .venv logs __pycache__ .pytest_cache .ruff_cache dist *.egg-info
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc"      -delete 2>/dev/null || true
	@echo "   Clean"