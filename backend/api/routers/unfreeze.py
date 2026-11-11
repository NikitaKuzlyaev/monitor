import hashlib

from fastapi import APIRouter, Body, Depends

from backend.api.dependencies import get_staff_storage
from backend.api.routers.admin import require_admin
from backend.schemas.server import SuccessResponse
from backend.services.staff_state import StaffStateStorage

router = APIRouter(prefix="/api/unfreeze", tags=["unfreeze"])


@router.post("/load-logs")
async def load_log_for_unfreeze(
    data: str = Body(..., media_type="text/plain"),
    staff_storage: StaffStateStorage = Depends(get_staff_storage),
    _: None = Depends(require_admin),
):
    await staff_storage.save_unfreeze_logs(data)
    digest = hashlib.sha256(data.encode("utf-8")).hexdigest()
    return SuccessResponse(message=str(digest))


@router.get("/get-logs")
async def get_unfreeze_logs(
    staff_storage: StaffStateStorage = Depends(get_staff_storage),
):
    return {"data": await staff_storage.get_unfreeze_logs()}
