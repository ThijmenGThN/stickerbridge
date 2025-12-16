from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    telegram_bot_token: str = ""
    temp_dir: str = "/tmp/stickerbridge"
    job_ttl_seconds: int = 3600  # 1 hour
    max_stickers_per_pack: int = 200

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
