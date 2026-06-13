# Heritage Backend

FastAPI inference server for the Heritage Damage Assessment system.

## Quick start

```bash
# Local dev (from heritage-backend/)
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Docker (from heritage-backend/)
docker compose up
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/predict` | Single-image damage classification |
| POST | `/api/v1/predict/batch` | Multi-image batch assessment (up to 20) |
| POST | `/api/v1/compare` | Temporal comparison of two survey images |
| POST | `/api/v1/report` | Full structured assessment report |
| GET | `/api/v1/health/` | Liveness + model status |
| GET | `/api/v1/models` | Registered model list |

Full interactive docs available at `http://localhost:8000/docs` when `DEBUG=true`.
