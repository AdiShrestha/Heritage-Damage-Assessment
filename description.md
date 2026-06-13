# Heritage Damage Assessment — Project Description

## 1. Project Overview

Heritage Damage Assessment is a full-stack AI-powered platform for classifying structural
damage in cultural heritage sites (temples, stupas, historical buildings) from photographs.
The system is designed for use by conservation agencies, archaeologists, and restoration
teams in Nepal and similar regions with rich architectural heritage. A user uploads or
captures a photo of a heritage structure, and the system returns a damage classification
(Undamaged, Partial Damage, or Damaged), a confidence score, an uncertainty estimate, a
severity rating, and a Grad-CAM heatmap highlighting the regions that drove the prediction.

The project is organised as a monorepo with three independent sub-projects:

| Sub-project          | Purpose                                | Tech Stack                              |
|----------------------|----------------------------------------|-----------------------------------------|
| `heritage-backend`   | REST API & ML inference engine         | Python 3.12, FastAPI, PyTorch, YOLO     |
| `heritage-frontend`  | Web dashboard for browser-based usage  | React 18, Vite 5, TailwindCSS, Recharts |
| `heritage-mobile`    | Cross-platform mobile app              | React Native 0.76, Expo 52              |

A set of Jupyter notebooks at the repository root (`Damage_vision.ipynb`,
`deep-learning(YOLO mini).ipynb`, etc.) contain the original model training, evaluation,
and architecture comparison work that produced the weights used by the backend.

---

## 2. Backend — `heritage-backend`

### 2.1 Architecture

The backend is a production-grade FastAPI application structured in clean layers:

- **API layer** (`app/api/`) — versioned REST endpoints under `/api/v1/`.
- **Service layer** (`app/services/`) — orchestrates prediction, batching, caching, image
  validation, history tracking, and report generation.
- **ML layer** (`app/ml/`) — houses all model definitions, the MoE ensemble, individual
  expert predictors, Grad-CAM / attention rollout, uncertainty estimation (MC Dropout),
  severity scoring, temporal comparison, and expert disagreement analysis.
- **Core** (`app/core/`) — Pydantic-based config, structured JSON logging, custom
  exception hierarchy.
- **Middleware** (`app/middleware/`) — request-ID injection, request/response logging,
  global error handler.
- **Schemas** (`app/schemas/`) — Pydantic v2 request/response models for every endpoint.

### 2.2 Machine Learning Pipeline

The centrepiece is a **Mixture of Experts (MoE)** ensemble that fuses four deep-learning
backbones through a learned gating network:

| Expert           | Architecture      | Feature Dim | Weight File               |
|------------------|-------------------|-------------|---------------------------|
| ResNet-50        | torchvision       | 2 048       | `resnet50_best.pth`       |
| EfficientNet-B4  | torchvision       | 1 792       | `efficientnet_b4_best.pth`|
| ViT-B/16         | timm              | 768         | `vit_b16_best.pth`        |
| YOLO Damage      | custom CNN / YOLO | 256         | `yolo_damage_best.pth`    |

The gate network concatenates the four feature vectors (total 4 864 dims), passes them
through a three-layer MLP with GELU activations and dropout, and produces a softmax
weighting over the four experts' logit outputs. The fused logits are then softmaxed to
produce the final three-class probability distribution.

**Explainability:** For convolutional experts (ResNet, EfficientNet, YOLO), standard
Grad-CAM is computed using gradient-weighted activation maps from the deepest spatial
layer. For the ViT expert, attention rollout from the last transformer block's CLS-to-patch
attention is used instead. The heatmap is composited into an annotated image showing the
original photo side-by-side with the damage map, a colour-coded criticality banner, and
per-expert confidence bars.

**Uncertainty:** Monte Carlo Dropout with 15 stochastic forward passes provides calibrated
uncertainty estimates alongside point predictions.

### 2.3 API Endpoints

| Method | Path                        | Description                                    |
|--------|-----------------------------|------------------------------------------------|
| POST   | `/api/v1/predict/`          | Single-image damage assessment                 |
| POST   | `/api/v1/predict/batch`     | Batch assessment (up to 20 images)             |
| POST   | `/api/v1/compare`           | Temporal comparison of two survey photos       |
| GET    | `/api/v1/report/{id}`       | Retrieve a detailed assessment report          |
| GET    | `/api/v1/health/ready`      | Readiness probe                                |
| GET    | `/api/v1/models`            | List loaded models and their status            |
| GET    | `/api/v1/cache/stats`       | Cache hit/miss statistics                      |
| POST   | `/api/v1/cache/clear`       | Flush prediction cache                         |

### 2.4 Infrastructure

- **Docker:** Multi-stage Dockerfile (builder + runtime) with optional ML dependency
  install and a health-check probe. Docker Compose config included.
- **Config:** All settings are Pydantic `BaseSettings`, loaded from `.env` and environment
  variables (device, enabled models, cache TTL, MC Dropout passes, etc.).
- **Caching:** LRU prediction cache (configurable TTL and max entries) for request
  deduplication and fast repeated queries.
- **History:** SQLite-backed audit trail via `HistoryService`.
- **Tests:** pytest + pytest-asyncio + httpx test client. Current test files cover the
  health endpoint and the predict endpoint.

---

## 3. Frontend — `heritage-frontend`

### 3.1 Stack & Build

- **React 18** with functional components and hooks.
- **Vite 5** for dev server and production builds.
- **TailwindCSS 3** for utility-first styling with a custom heritage-themed palette
  (brick reds, golds, warm stones, parchment backgrounds).
- **React Router v6** for client-side navigation across three pages.

### 3.2 Pages & Features

| Page         | Description                                                                 |
|--------------|-----------------------------------------------------------------------------|
| `AssessPage` | Upload an image via drag-and-drop, select a model, run inference, view results |
| `ModelsPage` | View available models, their load status, and switch between them           |
| `AboutPage`  | Project information, architecture overview, team details                    |

### 3.3 Component Library

- **Layout:** `Navbar` (with health-status indicator), `Footer`, `HeritageScatter`
  (decorative background elements — stupas, temples, peacock motifs).
- **Upload:** `ImageDropzone` — drag-and-drop / click-to-select with file type and size
  validation.
- **Assessment:** `ResultCard`, `DamageLabel`, `ConfidenceChart` (Recharts bar chart),
  `GradCamViewer` (displays the composite heatmap image), `ModelSelector`.
- **Common:** `LoadingSpinner`, `ErrorAlert`.

### 3.4 Data Layer

- **Axios client** (`src/api/client.js`) — pre-configured with base URL from env vars,
  60-second timeout, automatic `X-Request-ID` header injection, and a response interceptor
  that normalises API errors into a consistent `{ message, error_code, status }` shape.
- **Custom hooks:** `useHealth` (polls backend readiness), `useModels` (fetches model
  list), `usePrediction` (manages the full upload → predict → display lifecycle).

---

## 4. Mobile App — `heritage-mobile`

### 4.1 Stack

- **React Native 0.76** with **Expo SDK 52** (managed workflow).
- **React Navigation 7** with a bottom-tab navigator (Assess, Models, About).
- Platform-specific styling (iOS vs Android safe areas, tab bar heights).

### 4.2 Screens & Components

The mobile app mirrors the web frontend's feature set with native equivalents:

| Screen         | Notable Additions                                          |
|----------------|------------------------------------------------------------|
| `AssessScreen` | Camera scanner via `expo-camera`, upload/scan mode toggle  |
| `ModelsScreen` | Model list with load-status badges                         |
| `AboutScreen`  | Project information                                        |

**Components (11 total):** `CameraScanner` (live camera feed with capture),
`ImageDropzone`, `ModelSelector`, `ResultCard`, `ConfidenceChart` (react-native-chart-kit),
`DamageLabel`, `GradCamViewer`, `HeritageCard`, `StatusBadge`, `ErrorAlert`,
`LoadingSpinner`.

### 4.3 Theme & Design

A consistent design language is shared between web and mobile via mirrored theme constants:
brick-red primary (`#A63A2A`), warm gold accents, parchment background (`#F5F0EB`), and
three damage-class colour schemes (green/stable, amber/partial, red/damaged).

---

## 5. Damage Classification Taxonomy

All three sub-projects share a unified three-class system:

| Class            | Criticality | Colour       | Meaning                                     |
|------------------|-------------|--------------|---------------------------------------------|
| Undamaged        | STABLE      | Green        | Structure is intact, no visible damage       |
| Partial Damage   | MINOR       | Amber/Yellow | Visible wear, cracks, or partial degradation |
| Damaged          | CRITICAL    | Red          | Severe structural damage, urgent attention   |

---

## 6. Current State of the Project

### 6.1 What Is Complete

- **ML Pipeline (Backend):** The full MoE ensemble architecture is implemented, including
  all four expert predictors, the gating network, Grad-CAM / ViT attention rollout,
  annotated composite visualization, MC Dropout uncertainty, severity scoring, temporal
  comparison, expert disagreement detection, and batch processing.
- **API Surface (Backend):** All REST endpoints (predict, batch, compare, report, health,
  models, cache) are implemented with Pydantic schemas, dependency injection, error
  handling, and middleware.
- **Web Frontend:** Fully functional Assess, Models, and About pages with image upload,
  model selection, result display (including GradCAM viewer and confidence chart), error
  handling, and loading states. Custom hooks handle all API communication.
- **Mobile App:** Feature-complete Expo app with camera scanning, image upload, model
  selection, and result display. All 11 components are built. Navigation and theming are
  done.
- **Infrastructure:** Dockerfile, Docker Compose, Makefile, structured logging, and test
  scaffolding are in place.

### 6.2 What Is Partially Complete or Needs Attention

- **Model Weights:** Only `resnet50_best.pth` (~490 MB) is present in the `weights/`
  directory. The remaining four weight files (`efficientnet_b4_best.pth`, `vit_b16_best.pth`,
  `yolo_damage_best.pth`, `gate_best.pth`) are missing. The MoE ensemble initialises those
  experts with random weights and logs warnings when they are absent — inference will run
  but produce unreliable results for any expert beyond ResNet.
- **Test Coverage:** Only two test files exist (`test_health.py`, `test_predict.py`). There
  are no tests for batch processing, temporal comparison, report generation, cache service,
  or any of the ML modules.
- **Frontend/Mobile → Batch & Compare:** The web and mobile frontends currently expose only
  single-image prediction. The batch prediction and temporal comparison API endpoints exist
  on the backend but have no corresponding UI.
- **Environment Config:** The mobile app's API base URL is hardcoded to `127.0.0.1:8000`.
  This needs to be configurable for physical device testing or deployment.
- **Frontend MoE/YOLO Selection:** The frontend and mobile `MODELS` constants list
  `['mock', 'resnet50', 'efficientnet_b4', 'vit_b16']` but exclude `moe` and `yolo_damage`,
  which are available on the backend. The MoE ensemble — the most powerful model — is not
  selectable from the UI.
- **Authentication & Authorization:** There is none. The API is fully open with CORS `*`.
- **CI/CD:** No GitHub Actions, deployment scripts, or automated pipeline exists.
- **Production Deployment:** No production-ready deployment configuration (cloud provider
  setup, SSL, domain, CDN for frontend static assets).

### 6.3 Repository Activity

The project has ~20 commits on the `main` branch with a `develop` branch also present on
the remote. Recent work focused on implementing the batch prediction service and caching,
refactoring the backend code structure, and iteratively building out the mobile app's UI
components (camera scanner, result cards, model selector, etc.).

---

## 7. Technology Summary

| Layer          | Technology                          | Version    |
|----------------|-------------------------------------|------------|
| ML Framework   | PyTorch + torchvision + timm        | ≥ 2.3      |
| Object Det.    | Ultralytics YOLO                    | ≥ 8.4      |
| Backend        | FastAPI + Pydantic + Uvicorn        | ≥ 0.111    |
| Web Frontend   | React + Vite + TailwindCSS          | 18 / 5 / 3 |
| Mobile         | React Native + Expo                 | 0.76 / 52  |
| HTTP Client    | Axios                               | ≥ 1.7      |
| Charts (Web)   | Recharts                            | ≥ 2.15     |
| Charts (Mobile)| react-native-chart-kit              | ≥ 6.12     |
| Navigation     | React Router (web) / React Nav (mob)| 6 / 7      |
| Language       | Python 3.12 / JavaScript (ES2022)   |            |
| Container      | Docker (multi-stage) + Compose      |            |
| Testing        | pytest + pytest-asyncio + httpx     |            |

---

## 8. Repository Structure (Simplified)

```
Heritage-Damage-Assessment/
├── heritage-backend/
│   ├── app/
│   │   ├── api/v1/endpoints/     # predict, batch, compare, report, health, models, cache
│   │   ├── core/                 # config, logging, exceptions
│   │   ├── middleware/           # error handler, logging, request-ID
│   │   ├── ml/                   # MoE, ResNet, EfficientNet, ViT, YOLO predictors
│   │   ├── schemas/              # Pydantic request/response models
│   │   ├── services/             # prediction, batch, cache, image, history, report
│   │   └── utils/                # constants, image helpers
│   ├── tests/                    # health + predict tests
│   ├── weights/                  # model weight files (only resnet50 present)
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── pyproject.toml
├── heritage-frontend/
│   ├── src/
│   │   ├── api/                  # Axios client, health, models, predict
│   │   ├── components/           # assessment, common, layout, upload
│   │   ├── hooks/                # useHealth, useModels, usePrediction
│   │   ├── pages/                # AssessPage, ModelsPage, AboutPage
│   │   ├── constants/            # API URL, class config, theme
│   │   └── utils/                # image helpers
│   ├── tailwind.config.js
│   └── package.json
├── heritage-mobile/
│   ├── src/
│   │   ├── api/                  # Axios client, health, models, predict
│   │   ├── components/           # 11 components including CameraScanner
│   │   ├── hooks/                # useHealth, useModels, usePrediction
│   │   ├── screens/              # AssessScreen, ModelsScreen, AboutScreen
│   │   ├── constants/            # theme, class config, spacing
│   │   └── utils/                # image helpers
│   ├── App.js
│   └── package.json
├── *.ipynb                       # Training & evaluation notebooks
└── README.md                     # Detailed backend API documentation
```
