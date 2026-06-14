# Heritage Damage Assessment System

A production-grade, multi-platform deep learning ecosystem for automated structural damage classification and monitoring in cultural heritage sites. 

The system leverages a **Mixture of Experts (MoE)** ensemble architecture (combining ResNet, EfficientNet, Vision Transformer, and YOLO) with intelligent gating, uncertainty-aware predictions (MC Dropout), and explainability (GradCAM heatmaps) to assist conservationists in prioritizing restoration.

---

## System Architecture

```
                                  ┌───────────────────────────┐
                                  │       Field Inspector     │
                                  │   (Expo Mobile Camera)    │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼ HTTP (Multipart JSON)
┌───────────────────────────┐     ┌───────────────────────────┐
│     Web Administrator     │     │      FastAPI Backend      │
│   (React Vite Dashboard)  ├────►│     (Inference Engine)    │
└───────────────────────────┘     └─────────────┬─────────────┘
                                                │
                               ┌────────────────┴────────────────┐
                               ▼                                 ▼
                     ┌───────────────────┐             ┌───────────────────┐
                     │ Mixture of Experts│             │   Support Layers  │
                     ├───────────────────┤             ├───────────────────┤
                     │ • Gate Network    │             │ • SQLite History  │
                     │ • Expert: ResNet  │             │ • LRU Cache       │
                     │ • Expert: EffNet  │             │ • GradCAM Engine  │
                     │ • Expert: ViT     │             │ • MC Dropout      │
                     │ • Expert: YOLO    │             │                   │
                     └───────────────────┘             └───────────────────┘
```

---

## Repository Directory Structure

The repository is organized as a monorepo containing the following components:

```
Heritage-Damage-Assessment/
├── heritage-backend/          # FastAPI REST API, model registry, inference pipeline
│   ├── app/                   # Source code for FastAPI application
│   │   ├── api/               # API Router and v1 endpoints (predict, batch, compare, etc.)
│   │   ├── ml/                # Predictor models, MoE gating, uncertainty, GradCAM
│   │   ├── services/          # Business logic layers (prediction, image handling, cache)
│   │   └── schemas/           # Pydantic schemas for requests/responses
│   ├── data/                  # Local sqlite databases and inference logs
│   ├── tests/                 # Comprehensive pytest suite
│   └── weights/               # Model checkpoints (.pt, .pth files)
│
├── heritage-frontend/         # React Web App built with Vite and Tailwind CSS
│   ├── src/
│   │   ├── pages/             # Dashboard, Assess, Batch, Compare, Models, Uncertainty pages
│   │   ├── components/        # Reusable UI widgets, charts, dropzones
│   │   └── api/               # API clients for communication with FastAPI backend
│   └── public/                # Static assets and templates
│
├── heritage-mobile/           # Expo React Native App for Android and iOS devices
│   ├── src/
│   │   ├── screens/           # Mobile screens (Assess, Compare, Batch, Models, About)
│   │   ├── hooks/             # Custom hooks (e.g., useHealth check)
│   │   └── constants/         # System constants, theme parameters, API endpoints
│   ├── App.js                 # App layout and bottom tab navigation
│   └── app.json               # Expo configuration
│
└── Jupyter Notebooks          # Model training, research, and analysis scripts (Root level)
    ├── moe_temple_trained.ipynb
    ├── Damage_vision.ipynb
    ├── deep-learning(YOLO mini).ipynb
    └── deep-learning_YOLO_mini_temple_only.ipynb
```

---

## Key Features

### 1. Multi-Expert Ensemble (MoE) Inference
- Combines predictions from multiple state-of-the-art vision models:
  - **ResNet-50**: Deep residual network for solid spatial feature extraction.
  - **EfficientNet-B4**: Parameter-efficient CNN for robust structural features.
  - **ViT-B16 (Vision Transformer)**: Captures global relationships and texture variations.
  - **YOLO Detector**: Detects specific structural damage zones (cracks, spalling, collapsed parts).
- **Gating Network**: A neural router that dynamically weights each expert's confidence based on the input image.

### 2. Uncertainty-Aware Assessment
- Integrates **Monte Carlo (MC) Dropout** (configurable iterations, default: 15) to calculate epistemic uncertainty.
- Displays standard deviation/uncertainty bounds on predictions to flag boundary or out-of-distribution images.

### 3. Explainability (XAI)
- **GradCAM Visualizations**: Generates heatmaps highlighting regions that contributed most to the damage classification.
- **Expert Weights Breakdown**: Visual representation of model contribution in predictions.
- **Consensus Metrics**: Measures expert agreement/disagreement metrics to catch ambiguous cases.

### 4. Temporal comparison
- Upload photos of the same structure taken at different points in time.
- Calculates damage severity index difference ($\delta$).
- Emits deterioration alerts (`STABLE`, `DETERIORATING`, `SIGNIFICANT_DETERIORATION`, `IMPROVING`, `SIGNIFICANT_IMPROVEMENT`).

### 5. Multi-Client support
- **Web Dashboard**: Interactive chart analytics of historic assessments, multi-image dropzones, and interactive confidence gauges.
- **Mobile Client**: Camera integration for real-time inspections in remote field locations with live server health diagnostics.

---

## Getting Started

### Prerequisites
- Python 3.12+ (Backend)
- Node.js 18+ and npm/pnpm (Frontend & Mobile)
- CUDA 11.8+ (For GPU acceleration on backend inference)
- Expo Go application installed on mobile (for local mobile testing)

---

### Backend Setup (`heritage-backend`)

1. **Navigate to backend directory:**
   ```bash
   cd heritage-backend
   ```

2. **Create and activate environment:**
   ```bash
   python3.12 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -e ".[inference,detection,logging,dev]"
   ```

4. **Prepare Model Weights:**
   Ensure model weights are placed inside the `weights/` directory:
   - `best.pt` — YOLO damage detector
   - `efficientnet_b4_best.pth` — EfficientNet expert
   - `resnet50_best.pth` — ResNet expert
   - `vit_b16_best.pth` — ViT expert
   - `gate_best.pth` — MoE gating network
   - `yolo_damage_best.pt` — Secondary YOLO weights

5. **Configure environment:**
   Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` configurations as needed (e.g., `TORCH_DEVICE=cuda` or `cpu`, `WARMUP_ON_STARTUP=True`).*

6. **Start the API server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   Access API documentation at `http://localhost:8000/docs`.

---

### Web Frontend Setup (`heritage-frontend`)

1. **Navigate to frontend directory:**
   ```bash
   cd heritage-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   Create a `.env` file:
   ```bash
   cp .env.example .env
   ```
   Ensure `VITE_API_BASE_URL` points to your running FastAPI backend:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   ```

4. **Start local Vite development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

### Mobile App Setup (`heritage-mobile`)

1. **Navigate to mobile directory:**
   ```bash
   cd heritage-mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure backend connection:**
   Open `src/constants/index.js` and edit the `API_BASE_URL` variable to point to your backend server's IP address (use your local machine's LAN IP address instead of `localhost` or `127.0.0.1` so your physical mobile device running Expo Go can communicate with it):
   ```javascript
   export const API_BASE_URL = 'http://<your-lan-ip>:8000/api/v1';
   ```

4. **Start the Expo server:**
   ```bash
   npx expo start
   ```

5. **Scan QR Code:**
   Open the Expo Go app on your iOS or Android device and scan the QR code printed in the terminal to launch the mobile inspector app.

---

## API Documentation

### Health and Model Status

- **GET `/api/v1/health/ready`**
  - *Description*: Live readiness probe.
  - *Response*: `{"status": "ready", "timestamp": "2026-06-13T22:15:00Z"}`

- **GET `/api/v1/models`**
  - *Description*: Retrieves all registered experts, gating layers, and their loaded status.

### Inference Endpoints

- **POST `/api/v1/predict/`**
  - *Description*: Assesses damage severity for a single uploaded image.
  - *Parameters*: `model_name` (default: `"moe"`)
  - *Payload*: `multipart/form-data` containing image `file`.
  - *Response*: 
    ```json
    {
      "request_id": "req_xyz123",
      "timestamp": "2026-06-13T22:15:00Z",
      "image_size": [1024, 768],
      "predictions": {
        "predicted_class": "high_damage",
        "confidence": 0.94,
        "severity_score": 0.87,
        "uncertainty": 0.05,
        "gradcam_image_base64": "iVBORw0KGgo...",
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

- **POST `/api/v1/predict/batch`**
  - *Description*: Upload up to 20 images for concurrent assessment. Returns list sorted by severity score (descending, highest urgency first).
  - *Payload*: Multiple image files via `files` form field.

- **POST `/api/v1/compare`**
  - *Description*: Computes severity delta ($\delta$) and change classification on two historical photos of the same site.
  - *Payload*: `image_t1` (older image) and `image_t2` (newer image).

- **GET `/api/v1/report/{request_id}`**
  - *Description*: Extracts detailed assessment breakdown, expert consensus, and prioritized restoration recommendations.

- **GET `/api/v1/cache/stats`** | **POST `/api/v1/cache/clear`**
  - *Description*: Cache monitoring and cache clearance utilities.

---

## Machine Learning & Notebooks Index

The repository houses several Jupyter Notebooks at the root directory documenting our neural training pipelines and exploratory phases:

1. **[moe_temple_trained.ipynb](file:///home/monarch/Documents/Deep_learning/mini%20project/Heritage-Damage-Assessment/moe_temple_trained.ipynb)**
   - Notebook focusing on training the Mixture of Experts architecture.
   - Sets up custom PyTorch training loops, validates the Gating network, and computes evaluation matrices.
   
2. **[deep-learning(YOLO mini).ipynb](file:///home/monarch/Documents/Deep_learning/mini%20project/Heritage-Damage-Assessment/deep-learning(YOLO%20mini).ipynb)**
   - Experimental notebook setting up YOLO models for detecting structural parts of Nepalese heritage temples and locating damaged regions.

3. **[deep-learning_YOLO_mini_temple_only.ipynb](file:///home/monarch/Documents/Deep_learning/mini%20project/Heritage-Damage-Assessment/deep-learning_YOLO_mini_temple_only.ipynb)**
   - Explores YOLO network fine-tuning focused exclusively on Temple detection. Used to filter out non-temple/background components from predictions.

4. **[Damage_vision.ipynb](file:///home/monarch/Documents/Deep_learning/mini%20project/Heritage-Damage-Assessment/Damage_vision.ipynb)**
   - Pre-processing exploration, visual augmentation scripts, and baseline testing for ResNet, EfficientNet, and ViT architectures.

---

## Testing & Quality Assurance

All core logic on the FastAPI backend is validated via unit and integration tests.

### Running Backend Tests
From the `heritage-backend` folder:
```bash
# Run pytest suite
pytest

# Run with verbose output
pytest -v

# Run with coverage report
pytest --cov=app --cov-report=html
```

### Formatting & Code Quality
We use `ruff` and `mypy` to verify quality across Python modules:
```bash
# Type verification
mypy app/

# Style checks and formatting
ruff check app/
ruff format app/
```

---

## Troubleshooting

| Problem | Cause | Resolution |
| :--- | :--- | :--- |
| **CUDA out of memory** | Large image inputs or high batch size | Run with `TORCH_DEVICE=cpu` in `.env`, or reduce concurrent requests. |
| **Mobile app cannot connect to backend** | Wrong IP configuration or firewall rules | Make sure both mobile device and backend server are connected to the same Wi-Fi network. Set `API_BASE_URL` in mobile App to the local LAN IP address of backend (e.g. `http://192.168.1.15:8000/api/v1`). |
| **Missing Weights error on startup** | Missing model files | Download model weight files and store in `heritage-backend/weights/` directory. |
| **Slow response times** | High MC Dropout passes | Lower `MC_DROPOUT_PASSES` value in backend `.env` file (e.g., from 15 to 5 or 0). |

---

## License & Citation

### Citation
If you use this project or research in your work, please cite:
```bibtex
@software{heritage_damage_assessment_2026,
  title={Heritage Damage Assessment System},
  author={Adi Shrestha},
  year={2026}
}
```
