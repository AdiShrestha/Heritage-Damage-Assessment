# Heritage Damage Assessment API

A production-grade deep learning REST API for automated structural damage classification in cultural heritage sites using ensemble learning (Mixture of Experts).

## Overview

This backend service uses a multi-expert ensemble (MoE) architecture to assess damage severity in heritage structures from photographs. It combines multiple deep learning models (ResNet, EfficientNet, ViT, YOLO) with intelligent gating to provide robust, uncertainty-aware damage predictions suitable for restoration prioritization.

**Key Capabilities:**
- Single-image damage assessment with confidence & uncertainty estimates
- Batch processing (up to 20 images per request) sorted by urgency
- Temporal comparison between survey dates to detect deterioration trends
- Explainability via GradCAM heatmaps
- Expert disagreement detection for flagging ambiguous cases
- Caching & history tracking for repeated assessments

## Architecture

```
┌─────────────────────────────────────────┐
│      FastAPI REST Interface             │
├─────────────────────────────────────────┤
│ /predict  | /predict/batch | /compare  │
│ /report   | /health        | /cache    │
└──────────┬──────────────────────────────┘
           │
    ┌──────▼──────────────────┐
    │   Service Layer         │
    ├─────────────────────────┤
    │ PredictionService       │
    │ BatchPredictionService  │
    │ TemporalComparator      │
    │ ReportService           │
    └──────┬──────────────────┘
           │
    ┌──────▼──────────────────────┐
    │  Mixture of Experts Model   │
    ├──────────────────────────────┤
    │ • Gate Network (expert weighting) │
    │ • Expert 1: ResNet50         │
    │ • Expert 2: EfficientNet-B4  │
    │ • Expert 3: ViT-B16          │
    │ • Expert 4: YOLO Detector    │
    └──────────────────────────────┘
           │
    ┌──────▼──────────────────────┐
    │  ML Pipeline                 │
    ├──────────────────────────────┤
    │ • Image preprocessing        │
    │ • Uncertainty estimation     │
    │ • Severity scoring           │
    │ • Cache management           │
    └──────────────────────────────┘
```

## Features

### 1. **Single Image Prediction**
- Upload an image, get damage assessment with:
  - Classification (e.g., "high_damage", "moderate_damage")
  - Confidence score (0–1)
  - Severity score (continuous 0–1)
  - Uncertainty estimate (MC dropout)
  - GradCAM heatmap (damage visualization)
  - Expert consensus/disagreement metrics

### 2. **Batch Processing**
- Submit up to 20 images in one request
- Concurrent inference for efficiency
- Results automatically sorted by severity (highest urgency first)
- Per-image breakdowns + aggregate statistics

### 3. **Temporal Comparison**
- Compare two survey photos of the same site
- Detect deterioration vs. improvement
- Severity delta tracking
- Restoration recommendations based on change patterns

### 4. **Explainability & Diagnostics**
- GradCAM visualization of damage regions
- Expert weight breakdown (how much each model contributed)
- Expert disagreement detection for uncertain cases
- Model performance reports

### 5. **Caching & History**
- Request deduplication (LRU cache)
- SQLite history database for audit trails
- Rapid response on repeated queries

## Installation

### Prerequisites
- Python 3.12+
- CUDA 11.8+ (for GPU inference, optional but recommended)
- Docker & Docker Compose (optional, for containerized deployment)

### Local Setup

1. **Clone and enter the directory:**
   ```bash
   cd heritage-backend
   ```

2. **Create a virtual environment:**
   ```bash
   python3.12 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -e ".[inference,detection,logging,dev]"
   ```

4. **Verify model weights are in place:**
   ```bash
   ls -la weights/
   ```
   Required files:
   - `best.pt` — YOLO damage detector
   - `efficientnet_b4_best.pth` — EfficientNet expert
   - `resnet50_best.pth` — ResNet expert
   - `vit_b16_best.pth` — ViT expert
   - `gate_best.pth` — MoE gating network
   - `yolo_damage_best.pt` — Object detection (YOLO)

5. **Configure environment (optional):**
   ```bash
   cat > .env << 'EOF'
   DEBUG=True
   ENVIRONMENT=development
   TORCH_DEVICE=cuda
   LOG_LEVEL=INFO
   LOG_FORMAT=json
   DEFAULT_MODEL=moe
   WARMUP_ON_STARTUP=True
   EOF
   ```

6. **Run the server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   Access API docs: http://localhost:8000/docs

### Docker Deployment

```bash
# Build with ML dependencies
docker compose build --build-arg INSTALL_ML=true

# Run with GPU support
docker compose up --gpus all
```

## API Endpoints

### Health & Status

**GET `/api/v1/health/ready`**  
Readiness probe (for health checks)  
Response: `{"status": "ready", "timestamp": "2024-06-12T..."}` (200)

**GET `/api/v1/models`**  
List available models and their load status  
Response:
```json
{
  "models": [
    {"name": "moe", "loaded": true, "type": "ensemble"},
    {"name": "resnet50", "loaded": true, "type": "classifier"}
  ]
}
```

### Single Prediction

**POST `/api/v1/predict/`**

Upload an image for damage assessment.

**Query Parameters:**
- `model_name` (string, default: `"moe"`) — Which model to use: `mock`, `resnet50`, `efficientnet_b4`, `vit_b16`, `moe`, `yolo_damage`

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/predict/" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@temple.jpg" \
  -F "model_name=moe"
```

**Response (200):**
```json
{
  "request_id": "req_abc123def456",
  "timestamp": "2024-06-12T14:30:00Z",
  "image_size": [1024, 768],
  "predictions": {
    "predicted_class": "high_damage",
    "confidence": 0.94,
    "severity_score": 0.87,
    "uncertainty": 0.05,
    "gradcam_image_base64": "iVBORw0KGgoAAAAN...",
    "gate_weights": {
      "resnet50": 0.25,
      "efficientnet_b4": 0.30,
      "vit_b16": 0.35,
      "yolo_damage": 0.10
    }
  },
  "processing_time_ms": 145
}
```

**Error Responses:**
- `413` — File too large (max 10MB)
- `415` — Unsupported image format (JPEG/PNG/WebP only)
- `404` — Model not found
- `500` — Inference failed

---

### Batch Prediction

**POST `/api/v1/predict/batch`**

Submit multiple images (up to 20) for concurrent assessment.

**Query Parameters:**
- `model` (string, default: `"moe"`) — Model to use for all images

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/predict/batch" \
  -F "files=@temple1.jpg" \
  -F "files=@temple2.jpg" \
  -F "files=@temple3.jpg" \
  -F "model=moe"
```

**Response (200):**
```json
{
  "request_id": "batch_xyz789",
  "timestamp": "2024-06-12T14:30:00Z",
  "summary": {
    "total_images": 3,
    "avg_severity": 0.72,
    "high_damage_count": 1,
    "moderate_damage_count": 2,
    "low_damage_count": 0
  },
  "results": [
    {
      "image_index": 1,
      "predicted_class": "high_damage",
      "severity_score": 0.87,
      "confidence": 0.94,
      "uncertainty": 0.05,
      "gradcam_image_base64": "iVBORw0KGgoAAAAN..."
    },
    {
      "image_index": 0,
      "predicted_class": "moderate_damage",
      "severity_score": 0.65,
      "confidence": 0.88,
      "uncertainty": 0.08
    },
    {
      "image_index": 2,
      "predicted_class": "moderate_damage",
      "severity_score": 0.63,
      "confidence": 0.82,
      "uncertainty": 0.10
    }
  ],
  "processing_time_ms": 312
}
```

Results are **sorted by severity (descending)** — most urgent sites first.

---

### Temporal Comparison

**POST `/api/v1/compare`**

Compare two surveys of the same heritage site to detect deterioration.

**Query Parameters:**
- `site_id` (string, optional) — Identifier for the site (for logging/history)

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/compare" \
  -F "image_t1=@temple_2023.jpg" \
  -F "image_t2=@temple_2024.jpg" \
  -F "site_id=temple_X_loc_Y"
```

**Response (200):**
```json
{
  "request_id": "cmp_001",
  "timestamp": "2024-06-12T14:30:00Z",
  "site_id": "temple_X_loc_Y",
  "comparison": {
    "severity_t1": 0.45,
    "severity_t2": 0.68,
    "severity_delta": 0.23,
    "change_label": "DETERIORATING",
    "cosine_distance": 0.42,
    "recommendation": "Schedule urgent restoration assessment"
  },
  "processing_time_ms": 278
}
```

**Change Labels:**
- `STABLE` — No significant change
- `DETERIORATING` — Damage increasing (δ_severity > 0.1)
- `SIGNIFICANT_DETERIORATION` — Large increase, act immediately (δ_severity > 0.25)
- `IMPROVING` — Restoration progress detected
- `SIGNIFICANT_IMPROVEMENT` — Major recovery observed

---

### Report Generation

**GET `/api/v1/report/{request_id}`**

Retrieve detailed assessment report (if available).

**Response (200):**
```json
{
  "request_id": "req_abc123def456",
  "report": {
    "summary": "High damage detected in load-bearing walls...",
    "damage_regions": ["west_wall", "northwest_corner"],
    "expert_consensus": 0.92,
    "recommended_actions": ["Immediate shoring", "Detailed survey"]
  }
}
```

---

### Cache Management

**GET `/api/v1/cache/stats`**  
Cache hit/miss statistics  

**POST `/api/v1/cache/clear`**  
Clear the prediction cache  

**GET `/api/v1/cache/list`**  
List cached predictions

---

## Configuration

All settings are loaded from environment variables or a `.env` file:

```env
# Application
APP_NAME=Heritage Damage Assessment API
APP_VERSION=1.0.0
DEBUG=False
ENVIRONMENT=production
API_V1_PREFIX=/api/v1

# Inference
TORCH_DEVICE=cuda               # 'cuda' for GPU, 'cpu' for CPU-only
DEFAULT_MODEL=moe               # Default model for predictions
ENABLED_MODELS=mock,resnet50,efficientnet_b4,vit_b16,yolo_damage,moe
MODEL_WEIGHTS_DIR=weights/

# Request limits
MAX_IMAGE_SIZE_MB=10.0
REQUEST_TIMEOUT_SECONDS=30.0

# Caching
CACHE_TTL_SECONDS=3600.0        # Time-to-live for cached predictions
CACHE_MAX_ENTRIES=512           # Max entries in LRU cache

# Uncertainty
MC_DROPOUT_PASSES=15            # Monte Carlo dropout iterations

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# CORS
ALLOWED_ORIGINS=*

# Startup
WARMUP_ON_STARTUP=True          # Pre-load all models on startup
```

## Development

### Project Structure

```
app/
├── main.py                    # FastAPI app factory & lifespan
├── api/
│   ├── router.py             # Route composition
│   └── v1/
│       ├── dependencies.py    # Dependency injection
│       └── endpoints/
│           ├── predict.py     # Single prediction
│           ├── batch.py       # Batch processing
│           ├── compare.py     # Temporal comparison
│           ├── report.py      # Report generation
│           ├── health.py      # Health checks
│           ├── models.py      # Model registry
│           └── uncertainty_cache.py
├── core/
│   ├── config.py              # Settings (pydantic)
│   ├── logging.py             # Structured JSON logging
│   └── exceptions.py          # Custom exceptions
├── middleware/
│   ├── error_handler.py       # Global exception handlers
│   ├── logging_middleware.py  # Request/response logging
│   └── request_id.py          # Request ID injection
├── ml/
│   ├── base_predictor.py      # Abstract predictor interface
│   ├── moe_predictor.py       # Mixture of Experts ensemble
│   ├── resnet_predictor.py    # ResNet expert
│   ├── efficientnet_predictor.py
│   ├── vit_predictor.py       # Vision Transformer expert
│   ├── yolo_predictor.py      # YOLO object detector
│   ├── model_registry.py      # Model lifecycle management
│   ├── uncertainty.py         # MC dropout uncertainty
│   ├── expert_disagreement.py # Consensus metrics
│   ├── temporal_comparator.py # Survey comparison
│   ├── severity_scorer.py     # Damage severity quantification
│   ├── report_service.py      # Report generation
│   ├── history_service.py     # Audit trail
│   └── preprocessing.py       # Image preprocessing
├── services/
│   ├── prediction_service.py  # Prediction orchestration
│   ├── batch_service.py       # Batch processing orchestration
│   ├── image_service.py       # Image validation & loading
│   └── cache_service.py       # Request caching (LRU)
├── schemas/
│   ├── prediction.py          # Request/response schemas
│   ├── batch.py
│   ├── compare.py
│   ├── report.py
│   ├── health.py
│   └── errors.py
└── utils/
    ├── constants.py           # Global constants
    ├── image_utils.py         # Image processing helpers
    └── __init__.py
```

### Running Tests

```bash
# All tests
pytest

# Specific test file
pytest tests/test_predict.py -v

# With coverage
pytest --cov=app --cov-report=html
```

### Linting & Formatting

```bash
# Type checking
mypy app/

# Linting
ruff check app/

# Format
ruff format app/
```

## Performance & Scalability

- **Single Prediction:** ~150–200ms (GPU), ~800–1200ms (CPU)
- **Batch (10 images):** ~300–400ms (parallelized inference)
- **Cache Hit:** <5ms
- **Memory:** ~4GB (all models loaded)
- **Throughput:** 6–8 req/s per worker (1 GPU)

**Scaling Tips:**
- Use multiple workers: `--workers 4` (one GPU recommended per worker)
- Enable caching for repeated assessments
- Use batch endpoints for bulk processing
- Consider load balancing with nginx/HAProxy

## Logging

Logs are structured JSON by default (configurable via `LOG_FORMAT=text`):

```json
{
  "timestamp": "2024-06-12T14:30:15.123Z",
  "level": "INFO",
  "logger": "app.ml.moe_predictor",
  "message": "MoE prediction completed",
  "request_id": "req_abc123",
  "model_name": "moe",
  "severity_score": 0.87,
  "inference_time_ms": 145
}
```

View logs:
```bash
# Docker
docker compose logs -f backend

# Local
tail -f logs/app.log
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `CUDA out of memory` | Reduce batch size, use `TORCH_DEVICE=cpu`, or upgrade GPU |
| `Model not found` | Check `ENABLED_MODELS` config, verify weights in `weights/` |
| `Slow inference` | Enable GPU (`TORCH_DEVICE=cuda`), reduce `MC_DROPOUT_PASSES` |
| `High API latency` | Check cache effectiveness, consider async scaling |

## Dependencies

**Core:**
- `fastapi>=0.111.0` — Web framework
- `pydantic>=2.7.0` — Data validation
- `uvicorn>=0.29.0` — ASGI server

**ML:**
- `torch>=2.3.0` — Deep learning
- `torchvision>=0.18.0` — Vision models
- `timm>=1.0.27` — Vision Transformer models
- `ultralytics>=8.4.65` — YOLO
- `Pillow>=10.3.0` — Image processing

**Logging:**
- `python-json-logger>=2.0.7` — JSON structured logging

See [pyproject.toml](pyproject.toml) for full dependency list.

## License

[Add license information]

## Citation

If you use this API in research, please cite:

```bibtex
@software{heritage_damage_assessment_2024,
  title={Heritage Damage Assessment API},
  author={[Your Organization]},
  year={2024}
}
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Write tests for new features
4. Ensure code passes linting (`ruff check`, `mypy`)
5. Submit a pull request

## Support

For issues, questions, or feature requests:
- **GitHub Issues:** [Project Repository]
- **Email:** [support@example.com]
