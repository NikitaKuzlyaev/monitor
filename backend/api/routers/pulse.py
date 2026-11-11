from typing import Any

from fastapi import APIRouter, Depends

from backend.api.dependencies import get_codeforces_fetcher
from backend.codeforces.sendler import CodeforcesFetcher

router = APIRouter(prefix="/api/pulse", tags=["pulse"])


def cache_response(data: Any) -> dict[str, Any]:
    if not data:
        return {"status": "warming_up", "data": None}
    return {"status": "ok", "data": data}


@router.get("/submissions")
async def get_pulse_submissions(
    codeforces_fetcher: CodeforcesFetcher = Depends(get_codeforces_fetcher),
):
    return cache_response(await codeforces_fetcher.get_cached_submissions())


@router.get("/standings")
async def get_pulse_standings(
    codeforces_fetcher: CodeforcesFetcher = Depends(get_codeforces_fetcher),
):
    return cache_response(await codeforces_fetcher.get_cached_standings())


@router.get("/statistics")
async def get_pulse_statistics(
    codeforces_fetcher: CodeforcesFetcher = Depends(get_codeforces_fetcher),
):
    return cache_response(await codeforces_fetcher.get_cached_statistics())
