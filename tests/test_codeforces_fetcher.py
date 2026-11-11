from typing import Any

from backend.codeforces.sendler import CodeforcesFetcher
from backend.interfaces.kv_storage import KVStorage


class MemoryStorage(KVStorage):
    def __init__(self) -> None:
        self.values: dict[str, str] = {}

    async def get(self, key: str) -> str | None:
        return self.values.get(key)

    async def set(self, key: str, value: str, ttl_seconds: int | None = None) -> None:
        self.values[key] = value

    async def delete(self, key: str) -> None:
        self.values.pop(key, None)

    async def close(self) -> None:
        return None


class FakeCodeforcesClient:
    async def get_submissions(self, contest_id: int, count: int = 20) -> list[dict[str, Any]]:
        assert contest_id == 42
        return [{"id": 1, "teamHandle": "team"}]

    async def get_standings(self, contest_id: int, count: int = 50) -> dict[str, Any]:
        assert contest_id == 42
        return {
            "result": {
                "rows": [
                    {
                        "problemResults": [
                            {"points": 1, "rejectedAttemptCount": 2},
                            {"points": 0, "rejectedAttemptCount": 1},
                        ]
                    }
                ]
            }
        }


async def test_refresh_caches_data_and_statistics() -> None:
    fetcher = CodeforcesFetcher(MemoryStorage(), FakeCodeforcesClient())

    await fetcher.refresh_all(42)

    assert await fetcher.get_cached_submissions() == [{"id": 1, "teamHandle": "team"}]
    assert await fetcher.get_cached_statistics() == {"problemsSolved": 1, "submissionsMade": 4}


async def test_refresh_skips_an_unconfigured_contest() -> None:
    storage = MemoryStorage()
    fetcher = CodeforcesFetcher(storage, FakeCodeforcesClient())

    await fetcher.refresh_all(0)

    assert storage.values == {}
