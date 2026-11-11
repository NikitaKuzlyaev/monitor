from secrets import compare_digest, token_urlsafe

from backend.interfaces.kv_storage import KVStorage

ACTIVE_ADMIN_SESSION_KEY = "admin:active-session"


class AdminSessionService:
    """Maintains one active administrator session across all browsers."""

    def __init__(self, storage: KVStorage, max_age_seconds: int) -> None:
        self._storage = storage
        self._max_age_seconds = max_age_seconds

    async def create(self) -> str:
        token = token_urlsafe(32)
        await self._storage.set(ACTIVE_ADMIN_SESSION_KEY, token, self._max_age_seconds)
        return token

    async def is_valid(self, token: str | None) -> bool:
        if not token:
            return False
        active_token = await self._storage.get(ACTIVE_ADMIN_SESSION_KEY)
        return active_token is not None and compare_digest(token, active_token)

    async def revoke(self, token: str | None) -> None:
        if await self.is_valid(token):
            await self._storage.delete(ACTIVE_ADMIN_SESSION_KEY)
