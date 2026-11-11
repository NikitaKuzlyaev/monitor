from functools import lru_cache

from backend.codeforces.sendler import CodeforcesFetcher
from backend.configuration.settings import settings
from backend.redis_storage.client import RedisClient
from backend.services.admin_session import AdminSessionService
from backend.services.staff_state import StaffStateStorage


@lru_cache
def get_redis() -> RedisClient:
    return RedisClient()


@lru_cache
def get_codeforces_fetcher() -> CodeforcesFetcher:
    return CodeforcesFetcher(storage=get_redis())


def get_staff_storage() -> StaffStateStorage:
    return StaffStateStorage(storage=get_redis())


def get_admin_session_service() -> AdminSessionService:
    return AdminSessionService(
        storage=get_redis(), max_age_seconds=settings.admin_session_max_age_seconds
    )
