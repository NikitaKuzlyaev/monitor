from backend.services.admin_session import AdminSessionService
from tests.test_codeforces_fetcher import MemoryStorage


async def test_only_the_latest_admin_session_is_valid() -> None:
    sessions = AdminSessionService(MemoryStorage(), max_age_seconds=60)
    first_token = await sessions.create()
    second_token = await sessions.create()

    assert not await sessions.is_valid(first_token)
    assert await sessions.is_valid(second_token)
