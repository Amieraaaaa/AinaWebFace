# SkinSight — Product Requirements Document
**Version:** 1.0  
**Author:** Noraina Suria Amiera Norazman  
**Institution:** Management and Science University (MSU)  
**Programme:** Bachelor in Computer Science (Honours)  
**Year:** 2025  
**Status:** Active Development

---

## 1. Executive Summary

SkinSight is an AI-powered facial skin analysis and personalised skincare recommendation system designed for Malaysian university students. It addresses the gap between expensive clinical dermatology and the absence of affordable, personalised, stigma-free skincare guidance accessible to students.

The system uses a MobileNetV2 convolutional neural network to detect seven skin conditions from a selfie, then runs a hybrid content-based recommendation engine to generate a daily AM/PM skincare routine filtered by budget tier, halal certification, and the student's lifestyle profile.

**This is a non-clinical support tool. It does not replace a qualified dermatologist.**

---

## 2. Problem Statement

- University students experience high rates of acne, dryness, and hyperpigmentation due to stress, poor diet, and environmental factors
- Dermatologist consultations in Malaysia cost RM80–300 per visit — inaccessible to most students
- Existing AI skincare apps target general consumers with generic, brand-biased recommendations
- No existing tool combines CNN-based facial analysis + lifestyle context + halal product filtering for the Malaysian student demographic
- Social stigma around visible skin conditions reduces help-seeking behaviour

---

## 3. Project Objectives (from proposal Section 1.2)

| ID | Objective | Success Metric |
|----|-----------|----------------|
| OBJ-1 | AI-powered facial analysis detecting 7 skin conditions | Accuracy ≥ 85%, F1 ≥ 0.82 on held-out test set |
| OBJ-2 | Personalised recommendation engine | Recommendation acceptance rate ≥ 70% in user study |
| OBJ-3 | Accessible UX — stigma-free, affordable, halal-aware | SUS score ≥ 75 in usability testing with students |
| OBJ-4 | Rigorous performance evaluation | Benchmark against 3 existing apps; full confusion matrix per condition |
| OBJ-5 | Ethical AI — bias-aware, privacy-first, transparent | Fitzpatrick parity gap < 10% across skin tone groups |

---

## 4. Target Users

### Primary: University Students (Malaysia)
- Age 18–26, budget-constrained (preferred spend < RM50 per product)
- Majority Muslim — halal certification is a required filter for many
- Fitzpatrick skin types III–V (tropical climate, diverse ethnicity)
- Access via smartphone or laptop with camera

### Secondary: System Administrators
- Manages AI model retraining pipeline
- Curates the product and routine database
- Monitors audit logs and usage analytics

---

## 5. System Scope

### In Scope
- User registration and profile management (Supabase Auth)
- Facial image capture and upload with quality validation (OpenCV)
- CNN-based skin condition detection: acne, dryness, oiliness, pigmentation, texture, sensitivity, redness
- Hybrid recommendation engine → AM/PM routine with ingredient rationale
- Product catalogue with halal, budget tier, and skin type filters
- Progress tracking — skin health score over time with trend charts
- Educational content articles per condition
- Weekly scan reminders (Supabase Realtime notifications)
- Admin panel — model management, routine curation, audit log
- Docker deployment

### Out of Scope
- Real-time video analysis
- Prescription product recommendations
- Clinical diagnosis or medical advice
- Payment processing or e-commerce
- Telemedicine / live dermatologist chat

---

## 6. Functional Requirements

### 6.1 Authentication (AUTH)
| ID | Requirement |
|----|-------------|
| AUTH-1 | Users register with email + password via Supabase Auth |
| AUTH-2 | Google OAuth login supported |
| AUTH-3 | Email verification required before first analysis |
| AUTH-4 | JWT validated on every protected API route |
| AUTH-5 | Role-based access: `student` and `admin` roles |

### 6.2 User Profile (PROF)
| ID | Requirement |
|----|-------------|
| PROF-1 | Profile auto-created on signup via Supabase trigger |
| PROF-2 | Student sets: skin type, Fitzpatrick scale, stress level, diet, sleep, allergies |
| PROF-3 | Incomplete profiles receive lower recommendation match scores |
| PROF-4 | User can delete all personal data (right to erasure) |

### 6.3 Facial Analysis (SCAN)
| ID | Requirement |
|----|-------------|
| SCAN-1 | Accept JPEG, PNG, WEBP up to 10 MB |
| SCAN-2 | OpenCV quality gate: sharpness ≥ 0.45, face confidence ≥ 0.60 |
| SCAN-3 | Reject poor-lighting images with specific error message |
| SCAN-4 | Image stored in private Supabase Storage with consent timestamp |
| SCAN-5 | MobileNetV2 returns severity score 0–100 per condition |
| SCAN-6 | Acne subtype classified: comedonal / inflammatory / cystic |
| SCAN-7 | Cystic acne triggers referral flag — no active ingredients recommended |
| SCAN-8 | Overall skin health score (0–100) computed as weighted composite |
| SCAN-9 | Results persisted to `skin_analyses` + `skin_condition_results` |
| SCAN-10 | Inference completes within 5 seconds |

### 6.4 Recommendation Engine (REC)
| ID | Requirement |
|----|-------------|
| REC-1 | Ingredients selected by clinical rules mapped to each condition |
| REC-2 | Scoring: severity × strength (45%) + evidence (30%) + skin type (20%) + Fitzpatrick (5%) |
| REC-3 | Incompatible pairs removed (Retinol + AHA, etc.) |
| REC-4 | Products filtered by: price tier, halal, skin type, user allergies |
| REC-5 | Output: ordered AM + PM steps with per-step instructions |
| REC-6 | Plain-language reasoning text generated per recommendation |
| REC-7 | User rating (1–5) stored for model retraining |
| REC-8 | `scoring_breakdown` JSONB persisted for audit |

### 6.5 Progress Tracking (PROG)
| ID | Requirement |
|----|-------------|
| PROG-1 | Dashboard shows skin health score trend over last 12 scans |
| PROG-2 | Per-condition severity trend chart |
| PROG-3 | Comparison between any two historical scans |

### 6.6 Educational Content (EDU)
| ID | Requirement |
|----|-------------|
| EDU-1 | Articles published by admin, linked to skin conditions |
| EDU-2 | Relevant articles surfaced automatically after each analysis |
| EDU-3 | Full-text search via PostgreSQL GIN index |

### 6.7 Admin Panel (ADMIN)
| ID | Requirement |
|----|-------------|
| ADMIN-1 | Upload new model weights; set active model version |
| ADMIN-2 | Create/update/deactivate routines, products, and ingredients |
| ADMIN-3 | All admin actions logged to immutable `admin_activity_logs` |
| ADMIN-4 | Fitzpatrick parity report: per-condition accuracy by skin tone |

---

## 7. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | API < 500ms non-inference; < 5s for `/analyze` |
| Security | HTTPS only; facial images encrypted at rest; JWT expiry 1 hour |
| Privacy | Explicit consent before upload; soft-delete + hard Storage removal |
| Bias | Fitzpatrick parity gap < 10% |
| Usability | SUS ≥ 75; WCAG 2.1 AA colour contrast |
| Reliability | 99% uptime during assessment period |

---

## 8. User Stories

```
As a student, I want to upload a selfie and receive a skin condition report
so that I understand what is affecting my skin without a dermatologist visit.

As a student, I want halal-certified product recommendations
so that I can follow my religious requirements without extra research.

As a student, I want to see my skin score trend over 3 months
so that I can see whether my routine is working.

As an admin, I want to retrain the CNN with new data
so that accuracy improves as more students use the system.

As an admin, I want a Fitzpatrick parity bias report
so that I can verify the model is fair across skin tones.
```

---

## 9. Constraints

- Non-clinical tool — severe conditions always referred to a dermatologist
- Training dataset may under-represent Fitzpatrick types V–VI
- MobileNetV2 inference runs on CPU for demo; GPU recommended for production
- Halal certification data manually curated by admin
- All monetary values in Malaysian Ringgit (MYR)

---

## 10. Milestones

| Phase | Deliverable | Week |
|-------|-------------|------|
| 1 | Supabase schema + Auth + profile UI | 2 |
| 2 | OpenCV pipeline + quality gate + Storage | 4 |
| 3 | MobileNetV2 training pipeline (demo mode) | 6 |
| 4 | Recommendation engine + product DB seed | 8 |
| 5 | Full Next.js frontend | 10 |
| 6 | Admin panel + notifications | 12 |
| 7 | User testing (n≥20) + bias audit | 14 |
| 8 | Final report + Docker deployment | 16 |
