from pydantic import BaseModel


class AdminLoginRequest(BaseModel):
    password: str


class SecureSetAllRequest(BaseModel):
    header: str
    desc: str
    page: int
    time_start: str
    timer_end_time: str
    pulse_timer_end_time: str
    information_page: str
    pulse_contest_id: int
    codeforces_refresh_interval_seconds: int
    staff_request_timeout_seconds: int
class SuccessResponse(BaseModel):
    message: str | None = ""
