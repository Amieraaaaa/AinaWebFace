# SkinSight — System Design Document
**Version:** 1.0  
**Status:** Active Development

---

## 1. Architecture Overview

SkinSight is a three-tier web application:

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENT TIER                                                │
│  Next.js 14 (App Router)  ·  Tailwind CSS                  │
│  Deployed: Vercel                                           │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS / REST JSON
┌────────────────────────▼────────────────────────────────────┐
│  APPLICATION TIER                                           │
│  FastAPI (Python 3.11)  ·  Uvicorn  ·  Docker              │
│  ┌──────────┐ ┌──────────────┐ ┌────────────────────────┐  │
│  │ Auth     │ │ Image        │ │ Recommendation         │  │
│  │ (JWT)    │ │ Pipeline     │ │ Engine                 │  │
│  │          │ │ (OpenCV)     │ │ (ingredient_rules.py)  │  │
│  └──────────┘ └──────┬───────┘ └────────────────────────┘  │
│                      │                                      │
│               ┌──────▼───────┐                              │
│               │ CNN Inference│                              │
│               │ MobileNetV2  │                              │
│               │ (TensorFlow) │                              │
│               └──────────────┘                              │
│  Deployed: Railway / Fly.io / Self-hosted VPS               │
└────────────────────────┬────────────────────────────────────┘
                         │ supabase-py (async)
┌────────────────────────▼────────────────────────────────────┐
│  DATA TIER                                                  │
│  Supabase (PostgreSQL 15)                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Auth     │ │ Database │ │ Storage  │ │ Realtime     │  │
│  │ (JWT)    │ │ (RLS)    │ │ (S3)     │ │ (WebSocket)  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│  Hosted: Supabase Cloud                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 14.x (App Router) | Framework — SSR, routing, image optimisation |
| React | 18.x | UI component library |
| Tailwind CSS | 3.x | Styling |
| Supabase JS SDK | 2.x | Auth, DB queries, Realtime, Storage from client |
| Recharts | 2.x | Progress trend charts |
| React Hook Form | 7.x | Form validation |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Python | 3.11 | Runtime |
| FastAPI | 0.111 | Web framework — async, OpenAPI auto-docs |
| Uvicorn | 0.30 | ASGI server |
| TensorFlow | 2.16 | CNN model training and inference |
| OpenCV headless | 4.9 | Image preprocessing, face detection |
| Pillow | 10.x | Image decoding, EXIF correction |
| supabase-py | 2.4 | Async Supabase client (DB + Storage) |
| python-jose | 3.3 | JWT verification |
| pydantic-settings | 2.x | Config from .env |
| pytest | 8.x | Test runner |

### Data
| Technology | Purpose |
|-----------|---------|
| Supabase PostgreSQL 15 | Primary database with RLS |
| Supabase Auth | User authentication, JWT issuance |
| Supabase Storage | Private facial image bucket |
| Supabase Realtime | Push notifications to frontend |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| Docker + Compose | Local development and deployment packaging |
| GitHub Actions | CI — run pytest, lint on every push |

---

## 3. Repository Structure

```
skinsight/
├── frontend/                    # Next.js 14 app
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx          # Overview + latest score
│   │   │   ├── analyze/page.tsx  # Upload + scan
│   │   │   ├── history/page.tsx  # Progress charts
│   │   │   ├── routine/page.tsx  # AM/PM routine view
│   │   │   └── learn/page.tsx    # Educational content
│   │   ├── admin/
│   │   │   ├── models/page.tsx
│   │   │   ├── products/page.tsx
│   │   │   └── logs/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx              # Landing page
│   ├── components/
│   │   ├── ui/                   # Reusable primitives
│   │   ├── scan/                 # Upload zone, quality feedback
│   │   ├── results/              # Condition bars, score ring
│   │   ├── routine/              # AM/PM step cards
│   │   └── charts/               # Progress trend charts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Browser client
│   │   │   └── server.ts         # Server component client
│   │   ├── api.ts                # FastAPI client functions
│   │   └── types.ts              # Shared TypeScript types
│   ├── middleware.ts              # Auth protection for dashboard routes
│   └── next.config.js
│
├── backend/                     # FastAPI app
│   ├── core/
│   │   ├── config.py             # Settings from .env
│   │   └── security.py           # JWT verification
│   ├── models/
│   │   ├── schemas.py            # Pydantic request/response models
│   │   └── skin_classifier.py    # MobileNetV2 architecture + inference
│   ├── routes/
│   │   ├── analysis.py           # POST /analyze, GET /analyze/{id}
│   │   └── recommendations.py    # POST /recommend
│   ├── services/
│   │   ├── image_processor.py    # OpenCV pipeline
│   │   ├── analysis_service.py   # Orchestrates full pipeline
│   │   ├── ingredient_rules.py   # Clinical rules (research-backed)
│   │   ├── recommender.py        # Hybrid recommendation engine
│   │   └── supabase_client.py    # Async DB + Storage wrapper
│   ├── tests/
│   │   └── test_recommender.py   # 39 pytest tests
│   ├── weights/                  # .gitignored — store trained .h5 here
│   ├── main.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
│
├── docker-compose.yml
├── Makefile
├── PRD.md
├── Design.md
├── AGENTS.md
└── README.md
```

---

## 4. Database Design

See `database_schema.sql` for the full schema. Summary:

| Table | Purpose |
|-------|---------|
| `profiles` | Extends `auth.users` — skin type, lifestyle, Fitzpatrick |
| `facial_images` | Image metadata only; bytes in Supabase Storage |
| `skin_analyses` | One row per CNN scan — overall score + model version |
| `skin_condition_results` | Granular per-condition outputs (acne subtype, sebum level, etc.) |
| `ingredients` | INCI ingredient catalogue with comedogenic + evidence ratings |
| `ingredient_skin_compatibility` | Clinical rules: ingredient → condition → skin type |
| `products` | Product catalogue with halal flag + MYR price tier |
| `product_ingredients` | Many-to-many: products ↔ ingredients |
| `routines` | Admin-curated routine templates |
| `routine_steps` | Ordered steps within a routine |
| `routine_step_products` | Products assigned to each step |
| `recommendations` | Generated recommendation per analysis + user feedback |
| `educational_content` | Articles linked to conditions |
| `notifications` | Scan/routine reminders (Realtime-enabled) |
| `admin_activity_logs` | Immutable audit trail |

**Key design decisions:**
- `auth.users` is managed by Supabase — `profiles` extends it via FK
- Every table has Row Level Security — students can only see their own data
- `skin_condition_results` uses nullable typed columns per condition (acne_subtype, sebum_production, etc.) — one row per condition per scan
- `v_ingredient_product_map` view pre-joins the recommender's core query

---

## 5. API Design

Base URL: `http://localhost:8000/api/v1`  
Auth: `Authorization: Bearer <supabase_jwt>`  
Docs: `http://localhost:8000/docs`

### Endpoints

```
GET  /health                         System health + model status

POST /analyze                        Upload image → run CNN → return analysis JSON
GET  /analyze/{analysis_id}          Fetch saved analysis

POST /recommend                      Generate AM/PM routine from analysis
GET  /recommend/{analysis_id}        Fetch saved recommendation
```

### POST /analyze — Request
```
Content-Type: multipart/form-data
Body: file (image/jpeg | image/png | image/webp, max 10MB)
```

### POST /analyze — Response (201)
```json
{
  "analysis_id": "uuid",
  "overall_health_score": 74.5,
  "skin_health_label": "Good",
  "model_version": "v1.0.0",
  "model_confidence": 0.87,
  "inference_duration_ms": 1240,
  "image_quality": {
    "quality_score": 0.82,
    "face_detected": true,
    "lighting_assessment": "good",
    "passed_quality_gate": true
  },
  "conditions": [
    {
      "condition_type": "acne",
      "severity_label": "moderate",
      "severity_score": 55.2,
      "acne_subtype": "inflammatory",
      "acne_lesion_count": 11,
      "affected_zones": ["t_zone", "chin"]
    },
    {
      "condition_type": "oiliness",
      "severity_label": "mild",
      "severity_score": 38.0,
      "sebum_production": "high",
      "oily_zones": ["t_zone", "forehead"]
    }
  ],
  "referral_recommended": false,
  "analysed_at": "2025-09-01T10:30:00Z"
}
```

### POST /recommend — Request
```json
{
  "analysis_id": "uuid",
  "known_skin_type": "oily",
  "fitzpatrick_scale": 4,
  "price_tier_preference": "budget",
  "is_halal_required": true,
  "known_allergies": ["FRAGRANCE"]
}
```

### POST /recommend — Response (201)
```json
{
  "recommendation_id": "uuid",
  "overall_match_score": 0.82,
  "reasoning_text": "Your analysis shows moderate inflammatory acne...",
  "am_routine": [
    {
      "step_number": 1,
      "step_name": "Cleanser",
      "instruction": "Massage onto damp skin for 60 seconds...",
      "products": [
        {
          "product_name": "CeraVe Foaming Cleanser",
          "brand_name": "CeraVe",
          "price_myr": 45.0,
          "price_tier": "mid",
          "is_halal": true,
          "key_ingredient": "NIACINAMIDE",
          "match_score": 0.88
        }
      ]
    }
  ],
  "pm_routine": [...],
  "safety_warnings": [],
  "referral_note": null
}
```

---

## 6. CNN Model Architecture

```
Input (224×224×3 RGB)
        ↓
MobileNetV2 backbone (ImageNet pretrained, frozen)
        ↓
GlobalAveragePooling2D
        ↓
Dense(512, relu) + Dropout(0.3) + L2 regularisation
        ↓
Dense(256, relu)
        ↓  ─── parallel heads ───────────────────────
[acne]  [dryness]  [oiliness]  [pigmentation]
[texture]  [sensitivity]  [redness]
        ↓
Softmax per head → severity score 0–100
```

**Training strategy:**
1. Freeze backbone — train heads only for 10 epochs (lr=1e-3)
2. Unfreeze top 30 backbone layers — fine-tune for 20 epochs (lr=1e-5)
3. Dataset: Unidata facial skin condition dataset + augmentation (flip, brightness, rotation)
4. Fitzpatrick-stratified train/val/test split to measure parity gap

---

## 7. Recommendation Engine Flow

```
CNN output (condition scores)
        ↓
ingredient_rules.py   →  select INCI candidates by condition + severity threshold
        ↓
_score_ingredient()   →  severity×strength (45%) + evidence (30%) + skin_type (20%) + fitzpatrick (5%)
        ↓
_apply_safety_rules() →  remove incompatible pairs + allergy exclusions
        ↓
Supabase query        →  v_ingredient_product_map WHERE inci_name IN (candidates)
                         AND price_tier IN allowed AND halal = required
        ↓
_build_routine()      →  group by routine_step → order AM / PM steps
        ↓
RecommendationResult  →  persist to recommendations table → return JSON
```

---

## 8. Security Design

| Concern | Approach |
|---------|----------|
| Authentication | Supabase Auth issues HS256 JWTs; FastAPI verifies with `python-jose` |
| Authorisation | Supabase RLS: every row-level SELECT/INSERT gated by `auth.uid()` |
| Image access | Private Storage bucket; access only via short-lived signed URLs (120s) |
| Service role | FastAPI uses service role key server-side only — never sent to client |
| Input validation | Pydantic models on all request bodies; file type + size checks |
| Audit | All admin mutations logged to immutable `admin_activity_logs` |
| HTTPS | Enforced at infrastructure level (Vercel + Railway) |

---

## 9. Error Handling

All API errors return:
```json
{
  "error": "ERROR_CODE",
  "detail": "Human-readable description",
  "code": "ERROR_CODE"
}
```

| Code | HTTP | Meaning |
|------|------|---------|
| `NO_FACE_DETECTED` | 400 | Haar cascade found no face |
| `IMAGE_TOO_BLURRY` | 400 | Laplacian variance below threshold |
| `POOR_LIGHTING` | 400 | HSV brightness out of acceptable range |
| `IMAGE_QUALITY_TOO_LOW` | 400 | Composite quality score < 0.45 |
| `FILE_TOO_LARGE` | 413 | Upload exceeds 10 MB |
| `UNSUPPORTED_FORMAT` | 400 | Not JPEG/PNG/WEBP |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 10. Environment Variables

```bash
# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

# Model
MODEL_MODE=demo           # demo | inference
MODEL_WEIGHTS_PATH=./weights/mobilenetv2_skinai_v1.h5
MODEL_VERSION=v1.0.0

# Quality gates
MIN_QUALITY_SCORE=0.45
MIN_FACE_CONFIDENCE=0.60
TARGET_IMAGE_SIZE=224

# API
API_PORT=8000
ALLOWED_ORIGINS=http://localhost:3000
DEBUG=false
```
