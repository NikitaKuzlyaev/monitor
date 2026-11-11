import asyncio
import contextlib
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.dependencies import get_codeforces_fetcher, get_redis, get_staff_storage
from backend.api.routers import admin, pulse, staff, unfreeze, utils
from backend.configuration.settings import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)


async def refresh_loop() -> None:
    while True:
        interval = settings.codeforces_refresh_interval_seconds
        try:
            state = await get_staff_storage().get_state()
            interval = state.codeforces_refresh_interval_seconds
            await get_codeforces_fetcher().refresh_all(state.pulse_contest_id)
        except Exception:
            logger.exception("Codeforces cache refresh failed")
        await asyncio.sleep(interval)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    refresh_task = asyncio.create_task(refresh_loop(), name="codeforces-cache-refresh")
    try:
        yield
    finally:
        refresh_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await refresh_task
        await get_redis().close()


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    @app.get("/health", tags=["health"])
    async def healthcheck() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(pulse.router)
    app.include_router(admin.router)
    app.include_router(staff.router)
    app.include_router(unfreeze.router)
    app.include_router(utils.router)
    return app


app = create_app()
