from pydantic import BaseModel, field_validator
import re


class ConvertRequest(BaseModel):
    telegram_url: str

    @field_validator("telegram_url")
    @classmethod
    def validate_telegram_url(cls, v: str) -> str:
        patterns = [
            r"^https?://(t\.me|telegram\.me|telegram\.dog)/addstickers/[\w]+$",
            r"^tg://addstickers\?set=[\w]+$",
        ]
        if not any(re.match(p, v.strip(), re.IGNORECASE) for p in patterns):
            raise ValueError("Invalid Telegram sticker pack URL")
        return v.strip()


class ConvertResponse(BaseModel):
    job_id: str


class JobProgress(BaseModel):
    current: int
    total: int
    message: str | None = None


class JobResult(BaseModel):
    download_url: str
    pack_name: str
    sticker_count: int


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: JobProgress
    result: JobResult | None = None
    error: str | None = None


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "0.1.0"
