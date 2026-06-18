# SkinSight

AI-powered facial skin analysis and personalised skincare recommendation system designed for Malaysian university students.

> **Disclaimer:** This is a non-clinical support tool. It does not replace a qualified dermatologist. Always consult a dermatologist for clinical concerns.

---

## Overview

SkinSight analyses a selfie using two AI models in parallel and returns a detailed skin condition report in under 5 seconds. A hybrid content-based recommendation engine then generates a personalised AM/PM skincare routine filtered by budget tier, halal certification, and the student's lifestyle profile.

**Author:** Noraina Suria Amiera Norazman
**Institution:** Management and Science University (MSU)
**Programme:** Bachelor in Computer Science (Honours)
**Year:** 2025

---

## Features

- **Dual AI analysis** — MobileNetV2 scores 7 conditions; Aurora EfficientNet identifies the dominant skin defect
- **OpenCV quality gate** — validates face detection, sharpness, and lighting before inference; rejects unusable images with specific user-friendly messages
- **Face-crop preprocessing** — detects and crops to the face region (with 20 % padding) before resizing to 224 × 224, so the model focuses on skin rather than background
- **ImageNet normalisation** — applies channel-wise mean/std normalisation matching MobileNetV2's pretrained weights
- Detects 7 conditions: acne, dryness, oiliness, pigmentation, texture, sensitivity, redness
- Acne subtype classification: comedonal / inflammatory / cystic (cystic triggers a dermatologist referral flag)
- Personalised AM/PM skincare routine with ingredient rationale and incompatibility resolution
- Halal-certified and budget-aware product filtering (prices in MYR)
- Fitzpatrick skin tone demotion for retinoids and AHAs (types IV–VI)
- **Progress tracking dashboard** — health score trend chart, per-condition line charts, delta from last scan, sparkline on the main dashboard
- Role-based access: `student` and `admin`
- Supports both HS256 and ES256 (JWKS) Supabase JWTs

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS, Recharts |
| Backend | FastAPI, Uvicorn, Python 3.11+ |
| AI — condition scoring | MobileNetV2 (TensorFlow/Keras, ImageNet pretrained) |
| AI — defect detection | Aurora EfficientNet (`yasyn14/skin-analyzer` via HuggingFace Hub) |
| Image processing | OpenCV 4, Pillow |
| Database | Supabase (PostgreSQL + Auth + RLS + Storage + Realtime) |
| Auth | Supabase Auth — HS256 and ES256 JWT, verified in FastAPI |
| Container | Docker |
| Testing | pytest (backend) |

---

## Prerequisites

- Node.js 20+
- Python 3.11+
- A [Supabase](https://supabase.com) project

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/<your-org>/skinsight.git
cd skinsight
```

### 2. Configure environment variables

Create `backend/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Model
MODEL_MODE=demo                              # demo | inference
MODEL_WEIGHTS_PATH=./weights/mobilenetv2_skinai_v1.h5
MODEL_VERSION=v1.0.0

# Quality gates (tuned for browser webcam captures)
MIN_FACE_CONFIDENCE=0.20
MIN_QUALITY_SCORE=0.35

# API
ALLOWED_ORIGINS=http://localhost:3000
DEBUG=false
```

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (backend only — never expose to frontend) |
| `SUPABASE_JWT_SECRET` | JWT secret from Supabase project settings |
| `MODEL_MODE` | `demo` returns mock scores; `inference` loads real weights |
| `MODEL_WEIGHTS_PATH` | Path to MobileNetV2 `.h5` weights file |
| `MIN_FACE_CONFIDENCE` | Face detection threshold (0–1). Default `0.20` suits arm's-length selfies |
| `MIN_QUALITY_SCORE` | Composite quality gate threshold. Default `0.35` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Initialise the database

Paste the contents of `database_schema.sql` into the Supabase **SQL Editor** and execute.

### 4. Install frontend dependencies

```bash
cd frontend
npm install
```

### 5. Install backend dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

> **TensorFlow** is only required for `MODEL_MODE=inference`. Demo mode works without it.
> CPU-only: `pip install tensorflow-cpu==2.16.1`

### 6. Run locally

```bash
# Backend
cd backend
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |

---

## API Endpoints

Base URL: `http://localhost:8000/api/v1`
Auth: `Authorization: Bearer <supabase_jwt>`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | System health, model mode, Supabase connectivity |
| `POST` | `/analyze/` | Upload image → quality gate → CNN → return analysis |
| `POST` | `/analyze/predict` | Base64 image → Aurora defect detection |
| `GET` | `/analyze/{analysis_id}` | Fetch a saved analysis by ID |
| `POST` | `/recommend` | Generate AM/PM routine from an analysis |
| `GET` | `/recommend/{analysis_id}` | Fetch a saved recommendation |

### POST `/analyze/`

Accepts `multipart/form-data` with a JPEG, PNG, or WEBP image (max 10 MB).

**Pipeline:**
1. MIME type and file size validation
2. OpenCV quality gate: face detection (Haar cascade), sharpness (Laplacian variance), lighting (HSV brightness)
3. Face crop + ImageNet normalisation → 224 × 224 float32 array
4. MobileNetV2 inference → severity scores (0–100) per condition
5. Persist to Supabase (`facial_images`, `skin_analyses`, `skin_condition_results`)

Returns overall health score, skin health label, per-condition severity, acne subtype, referral flag, and image quality metadata.

**Quality gate error codes:**

| Code | Meaning |
|------|---------|
| `NO_FACE_DETECTED` | Haar cascade found no face |
| `POOR_LIGHTING` | Image too dark (HSV brightness < 60) |
| `IMAGE_TOO_BLURRY` | Laplacian variance too low |
| `IMAGE_QUALITY_TOO_LOW` | Composite score below `MIN_QUALITY_SCORE` |
| `FILE_TOO_LARGE` | File exceeds 10 MB |
| `UNSUPPORTED_FORMAT` | Not JPEG, PNG, or WEBP |

### POST `/analyze/predict`

Accepts `{ "image": "<base64 string>" }` (data URI prefix optional).

Runs the Aurora EfficientNet model to classify the dominant skin defect from 9 classes: acne, dryness, eczema, normal, oiliness, pigmentation, redness, scars, wrinkles. Returns condition name, confidence percentage, severity level, and a plain-English description.

### POST `/recommend`

Accepts `analysis_id` + user preferences:

```json
{
  "analysis_id": "uuid",
  "known_skin_type": "oily",
  "fitzpatrick_scale": 3,
  "price_tier_preference": "budget",
  "is_halal_required": true,
  "known_allergies": []
}
```

Scoring formula: `severity × strength (45%) + evidence (30%) + skin type match (20%) + Fitzpatrick adjustment (5%)`

Incompatible pairs (e.g. Retinol + AHA) are automatically removed from the same routine.

---

## Image Processing Pipeline

```
Upload (JPEG/PNG/WEBP, ≤10 MB)
    │
    ▼
Validate MIME + size
    │
    ▼
Load PIL image → correct EXIF orientation
    │
    ▼
OpenCV quality gate
    ├─ Haar cascade face detection (scaleFactor=1.05, minNeighbors=3, minSize=50×50)
    ├─ Sharpness: Laplacian variance / 500 → reject if < 0.05
    ├─ Lighting: HSV brightness → reject if dark (< 60)
    └─ Composite score: sharpness×0.4 + face×0.4 + lighting×0.2 → reject if < MIN_QUALITY_SCORE
    │
    ▼
Crop to face bounding box (+ 20 % padding)
    │
    ▼
Resize to 224 × 224 (LANCZOS)
    │
    ▼
Normalise: (pixel/255 − ImageNet_mean) / ImageNet_std
    │
    ▼
MobileNetV2 inference → 7 severity scores (0–100)
```

---

## Project Structure

```
skinsight/
├── frontend/
│   ├── app/
│   │   ├── dashboard/        Live stats + sparkline + quick actions
│   │   ├── scan/             Camera capture + file upload
│   │   ├── results/          Analysis report + Aurora defect card
│   │   ├── history/          Progress charts (Recharts) + scan list
│   │   ├── routine/          AM/PM recommendation page
│   │   └── profile/          User profile & preferences
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── SkinCard.tsx
│   │   ├── SeverityBadge.tsx
│   │   └── providers/SessionProvider.tsx
│   └── lib/
│       ├── api/
│       │   ├── analyze.ts    analyzeImage(), predictDefect() with typed error codes
│       │   └── recommend.ts  getRecommendation()
│       └── supabase/         client.ts, server.ts
├── backend/
│   ├── core/
│   │   ├── config.py         Pydantic settings (quality gate thresholds, model config)
│   │   └── security.py       JWT decode — HS256 + ES256 (JWKS)
│   ├── models/
│   │   ├── schemas.py        Pydantic request/response models
│   │   └── skin_classifier.py  MobileNetV2 + Aurora SkinDefectClassifier
│   ├── routes/
│   │   ├── analysis.py       /analyze/ and /analyze/predict endpoints
│   │   └── recommendations.py
│   ├── services/
│   │   ├── image_processor.py  OpenCV quality gate + face crop + normalisation
│   │   ├── analysis_service.py Full analysis pipeline
│   │   ├── recommender.py      Ingredient scoring + routine builder
│   │   ├── ingredient_rules.py Clinical ingredient rule table + incompatible pairs
│   │   └── supabase_client.py  Async Supabase client singleton
│   └── tests/
│       └── test_recommender.py pytest — ingredient selection + scoring
├── PRD.md
├── Design.md
├── database_schema.sql
└── README.md
```

---

## Running Tests

```bash
cd backend
pytest
```

---

## AI Models

### MobileNetV2 — Condition Scorer

Seven-condition severity scorer. Returns a score of 0–100 per condition.

- **Demo mode** (`MODEL_MODE=demo`): returns deterministic mock scores derived from image pixel statistics — no weights required, full pipeline testable
- **Inference mode** (`MODEL_MODE=inference`): loads `mobilenetv2_skinai_v1.h5` and runs real TensorFlow inference

### Aurora EfficientNet — Defect Classifier

Classifies the dominant skin defect from 9 classes using the `yasyn14/skin-analyzer` model from HuggingFace Hub. Downloaded automatically on first run in inference mode and cached locally.

- **Demo mode**: returns a deterministic label seeded from image pixel statistics
- **Inference mode**: downloads `model-v1.keras` from HuggingFace Hub on startup

---

## Progress Tracking

The `/history` page (requires at least one completed scan) shows:

- **Stat cards** — total scans, latest score, change since last scan, all-time best
- **Health Score chart** — area chart of overall skin health score over up to 12 scans
- **Conditions chart** — 7-line chart showing each condition's severity trend over time
- **Scan list** — colour-coded score badges with links to individual reports

The dashboard shows a live sparkline of the last 10 scores and a trend indicator (improving / declining / steady).

---

## Deployment

| Service | Platform |
|---------|----------|
| Frontend | Vercel |
| Backend | Railway / Fly.io / self-hosted VPS |
| Database | Supabase Cloud |

Update `ALLOWED_ORIGINS` in `backend/.env` to your production frontend URL before deploying.
