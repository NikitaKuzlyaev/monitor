from fastapi import APIRouter, Body, Depends, HTTPException

from backend.api.routers.admin import require_admin
from backend.codeforces.utils.parse_codeforces_log_into_saris import parse_codeforces_log_into_saris

router = APIRouter(prefix="/api/utils", tags=["utils"])


@router.post("/map-codeforces-log-into-saris")
async def convert_codeforces_log_to_saris(
    data: str = Body(..., media_type="text/plain"),
    _: None = Depends(require_admin),
):
    try:
        return parse_codeforces_log_into_saris(data=data)
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=f"Invalid Codeforces log: {exc}") from exc
