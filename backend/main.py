import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import settings
from models.schemas import HealthResponse
from routes.analysis import router as analysis_router
from routes.recommendations import router as recommendations_router
from services.supabase_client import ping

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SkinSight API",
    description="AI-Powered Facial Skin Analysis & Skincare Recommendation System",
    version=settings.model_version,
    docs_url="/docs",
    redoc_url="/redoc",
    redirect_slashes=False,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
API_PREFIX = "/api/v1"
app.include_router(analysis_router, prefix=API_PREFIX)
app.include_router(recommendations_router, prefix=API_PREFIX)


@app.get(f"{API_PREFIX}/health", response_model=HealthResponse, tags=["Health"])
async def health_check() -> HealthResponse:
    """Return system health, model status, and Supabase connectivity."""
    from models.skin_classifier import classifier

    supabase_ok = await ping()
    return HealthResponse(
        status="ok" if supabase_ok else "degraded",
        model_mode=classifier.mode,
        model_version=classifier.version,
        supabase_connected=supabase_ok,
        detail={"model_loaded": classifier.is_loaded},
    )


@app.get(f"{API_PREFIX}/debug-token", tags=["Debug"])
async def debug_token(request: Request):
    """Decode token without verification — shows what PyJWT sees."""
    import jwt as pyjwt, time
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return {"error": "No Bearer token"}
    token = auth[7:]
    try:
        payload = pyjwt.decode(token, options={"verify_signature": False})
        now = int(time.time())
        exp = payload.get("exp", 0)
        return {
            "sub":    payload.get("sub"),
            "role":   payload.get("role"),
            "exp":    exp,
            "now":    now,
            "expired": exp < now,
            "expires_in_seconds": exp - now,
            "iss":    payload.get("iss"),
            "aud":    payload.get("aud"),
        }
    except Exception as e:
        return {"decode_error": str(e), "token_prefix": token[:40]}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"error": "INTERNAL_ERROR", "detail": str(exc), "code": "INTERNAL_ERROR"},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=settings.api_port, reload=settings.debug)
