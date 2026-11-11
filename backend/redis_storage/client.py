import redis.asyncio as redis

from backend.configuration.settings import settings
from backend.interfaces.kv_storage import KVStorage


class RedisClient(KVStorage):
    def __init__(self, db: int | None = None):
        self._client = redis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            db=settings.redis_db if db is None else db,
            decode_responses=True,
        )

    async def get(self, key: str) -> str | None:
        return await self._client.get(key)

    async def set(self, key: str, value: str, ttl_seconds: int | None = None) -> None:
        await self._client.set(key, value, ex=ttl_seconds)

    async def delete(self, key: str) -> None:
        await self._client.delete(key)

    async def close(self) -> None:
        await self._client.aclose()
