import json
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from typing import Any

from backend.configuration.settings import settings
from backend.interfaces.kv_storage import KVStorage
from backend.schemas.server import SecureSetAllRequest

DATE_FORMAT = "%Y-%m-%d %H:%M:%S"
STAFF_STATE_KEY = "staff:state"
UNFREEZE_LOGS_KEY = "unfreeze:logs"


@dataclass(slots=True)
class StaffState:
    header: str
    desc: str
    page: int
    time_start: str
    timer_end_time: str
    pulse_timer_end_time: str
    pulse_contest_id: int
    information_page: str
    codeforces_refresh_interval_seconds: int
    staff_request_timeout_seconds: int
    standings_url: str = "/"

    @classmethod
    def default(cls) -> "StaffState":
        default_time = (datetime.now() + timedelta(hours=2)).strftime(DATE_FORMAT)
        return cls(
            header="Hack IT",
            desc="Пятая олимпиада по программированию ИШИТР ТПУ",
            page=0,
            time_start=default_time,
            timer_end_time=default_time,
            pulse_timer_end_time=default_time,
            pulse_contest_id=settings.codeforces_contest_id,
            information_page="-_-",
            codeforces_refresh_interval_seconds=settings.codeforces_refresh_interval_seconds,
            staff_request_timeout_seconds=settings.staff_request_timeout_seconds,
        )

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "StaffState":
        default = asdict(cls.default())
        default.update(data)
        return cls(**{field: default[field] for field in cls.__dataclass_fields__})

    def to_response(self) -> dict[str, Any]:
        return {
            "header": self.header,
            "desc": self.desc,
            "page": self.page,
            "time_start": self.time_start,
            "timer_end_time": self.timer_end_time,
            "pulse_timer_end_time": self.pulse_timer_end_time,
            "pulse_contest_id": self.pulse_contest_id,
            "information_page": self.information_page,
            "codeforces_refresh_interval_seconds": self.codeforces_refresh_interval_seconds,
            "staff_request_timeout_seconds": self.staff_request_timeout_seconds,
        }


class StaffStateStorage:
    def __init__(self, storage: KVStorage):
        self.storage = storage

    async def get_state(self) -> StaffState:
        raw = await self.storage.get(STAFF_STATE_KEY)
        if raw is None:
            state = StaffState.default()
            await self.save_state(state)
            return state
        return StaffState.from_dict(json.loads(raw))

    async def save_state(self, state: StaffState) -> None:
        await self.storage.set(STAFF_STATE_KEY, json.dumps(asdict(state), ensure_ascii=False))

    async def update_from_request(self, params: SecureSetAllRequest) -> StaffState:
        self._validate_date(params.time_start)
        self._validate_date(params.timer_end_time)
        self._validate_date(params.pulse_timer_end_time)
        self._validate_codeforces_interval(params.codeforces_refresh_interval_seconds)
        self._validate_staff_timeout(params.staff_request_timeout_seconds)

        state = StaffState(
            header=params.header,
            desc=params.desc,
            page=params.page,
            time_start=params.time_start,
            timer_end_time=params.timer_end_time,
            pulse_timer_end_time=params.pulse_timer_end_time,
            pulse_contest_id=params.pulse_contest_id,
            information_page=params.information_page,
            codeforces_refresh_interval_seconds=params.codeforces_refresh_interval_seconds,
            staff_request_timeout_seconds=params.staff_request_timeout_seconds,
        )
        await self.save_state(state)
        return state

    async def get_unfreeze_logs(self) -> str:
        return await self.storage.get(UNFREEZE_LOGS_KEY) or ""

    async def save_unfreeze_logs(self, logs: str) -> None:
        await self.storage.set(UNFREEZE_LOGS_KEY, logs)

    @staticmethod
    def _validate_date(value: str) -> None:
        try:
            datetime.strptime(value, DATE_FORMAT)
        except ValueError as exc:
            raise ValueError(f"Неверный формат даты. Ожидается '{DATE_FORMAT}'") from exc

    @staticmethod
    def _validate_codeforces_interval(value: int) -> None:
        if not 5 <= value <= 300:
            raise ValueError("Codeforces refresh interval must be between 5 and 300 seconds")

    @staticmethod
    def _validate_staff_timeout(value: int) -> None:
        if not 1 <= value <= 60:
            raise ValueError("Staff request timeout must be between 1 and 60 seconds")
