from secrets import compare_digest

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from backend.api.dependencies import get_admin_session_service
from backend.configuration.settings import settings
from backend.schemas.server import AdminLoginRequest, SuccessResponse
from backend.services.admin_session import AdminSessionService

SESSION_COOKIE_NAME = "hackit_admin_session"

router = APIRouter(prefix="/api/admin", tags=["admin"])


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=settings.admin_session_max_age_seconds,
        httponly=True,
        secure=settings.admin_cookie_secure,
        samesite="strict",
        path="/",
    )


async def require_admin(
    request: Request,
    sessions: AdminSessionService = Depends(get_admin_session_service),
) -> None:
    if not await sessions.is_valid(request.cookies.get(SESSION_COOKIE_NAME)):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin login required")


@router.get("/session")
async def get_session_status(
    request: Request,
    sessions: AdminSessionService = Depends(get_admin_session_service),
) -> dict[str, bool]:
    return {"authenticated": await sessions.is_valid(request.cookies.get(SESSION_COOKIE_NAME))}


@router.post("/login", response_model=SuccessResponse)
async def login(
    payload: AdminLoginRequest,
    response: Response,
    sessions: AdminSessionService = Depends(get_admin_session_service),
) -> SuccessResponse:
    configured_code = settings.admin_code
    if configured_code is None:
        raise HTTPException(status_code=503, detail="Admin access is not configured")
    if not compare_digest(
        payload.password.encode("utf-8"), configured_code.get_secret_value().encode("utf-8")
    ):
        raise HTTPException(status_code=401, detail="Invalid password")

    set_session_cookie(response, await sessions.create())
    return SuccessResponse(message="Signed in")


@router.post("/logout", response_model=SuccessResponse)
async def logout(
    request: Request,
    response: Response,
    sessions: AdminSessionService = Depends(get_admin_session_service),
) -> SuccessResponse:
    await sessions.revoke(request.cookies.get(SESSION_COOKIE_NAME))
    response.delete_cookie(SESSION_COOKIE_NAME, path="/")
    return SuccessResponse(message="Signed out")
