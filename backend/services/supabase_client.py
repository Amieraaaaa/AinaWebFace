import logging
from functools import lru_cache

from supabase._async.client import AsyncClient
from supabase._async.client import create_client as acreate_client

from core.config import settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _get_client_coroutine():
    """Return the coroutine to create the async Supabase client (cached)."""
    return acreate_client(settings.supabase_url, settings.supabase_service_role_key)


_client: AsyncClient | None = None


async def get_supabase() -> AsyncClient:
    """Return the singleton async Supabase client, initialising it on first call."""
    global _client
    if _client is None:
        _client = await acreate_client(
            settings.supabase_url, settings.supabase_service_role_key
        )
        logger.info("Supabase async client initialised")
    return _client


async def upload_image(bucket: str, path: str, data: bytes, content_type: str) -> str:
    """Upload bytes to Supabase Storage and return the storage path.

    Args:
        bucket: Storage bucket name (e.g. 'skin-images').
        path: Object path inside the bucket (e.g. '{user_id}/{image_id}.jpg').
        data: Raw image bytes.
        content_type: MIME type string.

    Returns:
        The storage path that was written.
    """
    client = await get_supabase()
    await client.storage.from_(bucket).upload(
        path=path,
        file=data,
        file_options={"content-type": content_type, "upsert": "false"},
    )
    logger.debug("Uploaded image to %s/%s", bucket, path)
    return path


async def create_signed_url(bucket: str, path: str, expires_in: int = 120) -> str:
    """Create a short-lived signed URL for a private Storage object.

    Args:
        bucket: Storage bucket name.
        path: Object path inside the bucket.
        expires_in: Seconds until the URL expires (default 120).

    Returns:
        The signed URL string.
    """
    client = await get_supabase()
    response = await client.storage.from_(bucket).create_signed_url(path, expires_in)
    return response["signedURL"]


async def ping() -> bool:
    """Return True if Supabase is reachable."""
    try:
        client = await get_supabase()
        # Use auth admin API to verify connectivity — works even on empty DB
        await client.auth.get_user("ping")
    except Exception as exc:
        # A 400/422 error means Supabase replied — it is reachable
        err = str(exc).lower()
        if any(k in err for k in ["invalid", "token", "user", "400", "422", "not found"]):
            return True
        logger.warning("Supabase ping failed: %s", exc)
        return False
    return True
