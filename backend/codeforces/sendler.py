import asyncio
import hashlib
import json
import logging
import secrets
import time
from enum import StrEnum
from typing import Any
from urllib.parse import urlencode

import aiohttp

from backend.configuration.settings import Settings, settings
from backend.codeforces.utils.parsers import parse_submissions
from backend.interfaces.kv_storage import KVStorage

logger = logging.getLogger(__name__)


class CacheKey(StrEnum):
    SUBMISSIONS = "contest:submissions"
    STANDINGS = "contest:standings"
    STATISTICS = "contest:statistics"


class CodeforcesClient:
    """Small client for the public Codeforces contest API."""

    def __init__(self, app_settings: Settings = settings) -> None:
        self._settings = app_settings

    async def get_submissions(self, contest_id: int, count: int = 20) -> list[dict[str, Any]] | None:
        payload = await self._request(
            "contest.status", {"contestId": contest_id, "from": 1, "count": count}
        )
        return parse_submissions(payload) if payload else None

    async def get_standings(self, contest_id: int, count: int = 50) -> dict[str, Any] | None:
        return await self._request(
            "contest.standings",
            {"contestId": contest_id, "from": 1, "count": count, "asManager": "false"},
        )

    async def _request(self, method: str, params: dict[str, Any]) -> dict[str, Any] | None:
        request_params = self._with_signature(method, params)
        timeout = aiohttp.ClientTimeout(total=self._settings.codeforces_request_timeout_seconds)

        try:
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(
                    f"https://codeforces.com/api/{method}", params=request_params
                ) as response:
                    response.raise_for_status()
                    payload = await response.json()
        except (aiohttp.ClientError, asyncio.TimeoutError) as exc:
            logger.warning("Codeforces request to %s failed: %s", method, exc)
            return None

        if payload.get("status") != "OK":
            logger.warning("Codeforces API rejected %s: %s", method, payload.get("comment"))
            return None
        return payload

    def _with_signature(self, method: str, params: dict[str, Any]) -> dict[str, Any]:
        api_key = self._settings.codeforces_api_key
        api_secret = self._settings.codeforces_api_secret
        if not api_key or not api_secret:
            return params

        signed_params = {
            **params,
            "apiKey": api_key.get_secret_value(),
            "time": int(time.time()),
        }
        rand = secrets.token_hex(3)
        query = urlencode(sorted(signed_params.items()))
        signature = hashlib.sha512(
            f"{rand}/{method}?{query}#{api_secret.get_secret_value()}".encode()
        ).hexdigest()
        return {**signed_params, "apiSig": f"{rand}{signature}"}


class CodeforcesFetcher:
    """Refreshes and serves the Codeforces data cached in shared storage."""

    def __init__(self, storage: KVStorage, client: CodeforcesClient | None = None) -> None:
        self._storage = storage
        self._client = client or CodeforcesClient()

    async def refresh_all(self, contest_id: int) -> None:
        if contest_id <= 0:
            return

        try:
            submissions, standings = await asyncio.gather(
                self._client.get_submissions(contest_id),
                self._client.get_standings(contest_id),
            )
            if submissions is not None:
                await self._set_json(CacheKey.SUBMISSIONS, submissions)
            if standings is not None:
                await self._set_json(CacheKey.STANDINGS, standings)
                await self._set_json(CacheKey.STATISTICS, self._calculate_statistics(standings))
        except Exception:
            logger.exception("Could not refresh Codeforces cache")

    async def get_cached_submissions(self) -> list[dict[str, Any]] | None:
        return await self._get_json(CacheKey.SUBMISSIONS)

    async def get_cached_standings(self) -> dict[str, Any] | None:
        return await self._get_json(CacheKey.STANDINGS)

    async def get_cached_statistics(self) -> dict[str, int] | None:
        return await self._get_json(CacheKey.STATISTICS)

    async def _get_json(self, key: CacheKey) -> Any | None:
        raw = await self._storage.get(key)
        return json.loads(raw) if raw else None

    async def _set_json(self, key: CacheKey, value: Any) -> None:
        await self._storage.set(key, json.dumps(value, ensure_ascii=False))

    @staticmethod
    def _calculate_statistics(standings: dict[str, Any]) -> dict[str, int]:
        solved = 0
        submissions = 0
        for row in standings.get("result", {}).get("rows", []):
            for result in row.get("problemResults", []):
                if result.get("points") == 1:
                    solved += 1
                    submissions += 1
                submissions += result.get("rejectedAttemptCount", 0)
        return {"problemsSolved": solved, "submissionsMade": submissions}
