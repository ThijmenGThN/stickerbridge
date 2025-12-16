import asyncio
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Callable


class JobStatus(str, Enum):
    QUEUED = "queued"
    DOWNLOADING = "downloading"
    CONVERTING = "converting"
    ZIPPING = "zipping"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class JobProgress:
    current: int = 0
    total: int = 0
    message: str = ""


@dataclass
class JobResult:
    download_url: str = ""
    pack_name: str = ""
    sticker_count: int = 0


@dataclass
class Job:
    id: str
    telegram_url: str
    status: JobStatus = JobStatus.QUEUED
    progress: JobProgress = field(default_factory=JobProgress)
    result: JobResult | None = None
    error: str | None = None
    created_at: float = field(default_factory=time.time)
    subscribers: list[Callable] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "job_id": self.id,
            "status": self.status.value,
            "progress": {
                "current": self.progress.current,
                "total": self.progress.total,
                "message": self.progress.message,
            },
            "result": {
                "download_url": self.result.download_url,
                "pack_name": self.result.pack_name,
                "sticker_count": self.result.sticker_count,
            } if self.result else None,
            "error": self.error,
        }

    async def notify_subscribers(self, message: dict):
        for callback in self.subscribers:
            try:
                await callback(message)
            except Exception:
                pass


class JobStore:
    def __init__(self, ttl_seconds: int = 3600):
        self._jobs: dict[str, Job] = {}
        self._ttl_seconds = ttl_seconds
        self._cleanup_task: asyncio.Task | None = None

    def create_job(self, telegram_url: str) -> Job:
        job_id = str(uuid.uuid4())
        job = Job(id=job_id, telegram_url=telegram_url)
        self._jobs[job_id] = job
        return job

    def get_job(self, job_id: str) -> Job | None:
        return self._jobs.get(job_id)

    def delete_job(self, job_id: str) -> bool:
        if job_id in self._jobs:
            del self._jobs[job_id]
            return True
        return False

    async def update_job(
        self,
        job_id: str,
        status: JobStatus | None = None,
        progress: JobProgress | None = None,
        result: JobResult | None = None,
        error: str | None = None,
    ):
        job = self._jobs.get(job_id)
        if not job:
            return

        if status:
            job.status = status
        if progress:
            job.progress = progress
        if result:
            job.result = result
        if error:
            job.error = error

        # Notify WebSocket subscribers
        message = {
            "type": "progress" if status != JobStatus.COMPLETED and status != JobStatus.FAILED else status.value,
            "status": job.status.value,
            "current": job.progress.current,
            "total": job.progress.total,
            "message": job.progress.message,
        }

        if job.status == JobStatus.COMPLETED and job.result:
            message = {
                "type": "completed",
                "download_url": job.result.download_url,
                "pack_name": job.result.pack_name,
                "sticker_count": job.result.sticker_count,
            }
        elif job.status == JobStatus.FAILED:
            message = {
                "type": "failed",
                "error": job.error or "Unknown error",
            }

        await job.notify_subscribers(message)

    def cleanup_expired(self):
        """Remove jobs older than TTL"""
        now = time.time()
        expired = [
            job_id for job_id, job in self._jobs.items()
            if now - job.created_at > self._ttl_seconds
        ]
        for job_id in expired:
            del self._jobs[job_id]

    async def start_cleanup_loop(self):
        """Start background cleanup task"""
        while True:
            await asyncio.sleep(300)  # Check every 5 minutes
            self.cleanup_expired()


# Global job store instance
job_store = JobStore()
