import base64
import json
import logging
import urllib.request
from functools import lru_cache
from typing import Any

from jose import jwt as jose_jwt
from jose.exceptions import ExpiredSignatureError, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.config import settings

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer()


@lru_cache(maxsize=1)
def _fetch_jwks() -> dict:
    """Fetch and cache Supabase's public JWKS (used for ES256 verification)."""
    url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            return json.loads(resp.read())
    except Exception as exc:
        logger.error("Failed to fetch JWKS from %s: %s", url, exc)
        return {"keys": []}


def _get_jwks_key(kid: str) -> dict:
    """Return the JWK dict for the given key ID, retrying once if the cache is stale."""
    jwks = _fetch_jwks()
    key_data = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
    if key_data is None:
        _fetch_jwks.cache_clear()
        jwks = _fetch_jwks()
        key_data = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
    if key_data is None:
        raise JWTError(f"No JWKS key found for kid={kid!r}")
    return key_data


def _decode_jwt(token: str) -> dict[str, Any]:
    """Decode and verify a Supabase JWT.

    Newer Supabase projects issue ES256 tokens (verified via JWKS public key).
    Older projects use HS256 (verified via base64-encoded JWT secret).
    """
    try:
        header = jose_jwt.get_unverified_header(token)
    except JWTError as exc:
        raise JWTError(f"Malformed JWT header: {exc}") from exc

    alg = header.get("alg", "HS256")

    if alg == "ES256":
        kid = header.get("kid", "")
        print(f"[DEBUG] ES256 token — kid={kid}", flush=True)
        try:
            key_data = _get_jwks_key(kid)
            print(f"[DEBUG] JWKS key found — kty={key_data.get('kty')} kid={key_data.get('kid')}", flush=True)
        except Exception as exc:
            print(f"[DEBUG] JWKS key lookup FAILED: {exc}", flush=True)
            raise
        try:
            result = jose_jwt.decode(
                token,
                key_data,
                algorithms=["ES256"],
                options={"verify_aud": False},
            )
            print("[DEBUG] ES256 verification SUCCESS", flush=True)
            return result
        except Exception as exc:
            print(f"[DEBUG] ES256 verification FAILED: {exc}", flush=True)
            raise

    # HS256 fallback — try base64-decoded secret first, then raw string
    secret = settings.supabase_jwt_secret
    try:
        key = base64.b64decode(secret)
        return jose_jwt.decode(token, key, algorithms=["HS256"], options={"verify_aud": False})
    except Exception:
        pass
    return jose_jwt.decode(token, secret, algorithms=["HS256"], options={"verify_aud": False})


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict[str, Any]:
    """Validate the Supabase access token and return its payload."""
    token = credentials.credentials
    try:
        payload = _decode_jwt(token)
        logger.debug("JWT ok — sub=%s role=%s", payload.get("sub"), payload.get("role"))
    except ExpiredSignatureError:
        logger.warning("JWT expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired — please sign in again",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError as exc:
        logger.warning("JWT invalid: %s | prefix: %.40s", exc, token)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


async def require_admin(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Additionally requires the admin role."""
    role = current_user.get("user_metadata", {}).get("role", "student")
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
