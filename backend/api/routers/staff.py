from fastapi import APIRouter, Body, Depends, HTTPException

from backend.api.dependencies import get_staff_storage
from backend.api.routers.admin import require_admin
from backend.schemas.server import SecureSetAllRequest, SuccessResponse
from backend.services.staff_state import StaffStateStorage

router = APIRouter(prefix="/api", tags=["staff"])


@router.get("/staff")
async def get_staff(
    staff_storage: StaffStateStorage = Depends(get_staff_storage),
):
    state = await staff_storage.get_state()
    return state.to_response()


@router.post("/set-all")
async def set_all(
    params: SecureSetAllRequest = Body(...),
    staff_storage: StaffStateStorage = Depends(get_staff_storage),
    _: None = Depends(require_admin),
):
    try:
        await staff_storage.update_from_request(params)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return SuccessResponse()
