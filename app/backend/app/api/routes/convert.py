import asyncio
import shutil
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse

from app.core.config import get_settings
from app.core.jobs import job_store, JobStatus, JobProgress, JobResult
from app.models.schemas import ConvertRequest, ConvertResponse, JobStatusResponse
from app.services.telegram import download_sticker_pack, extract_pack_name
from app.services.converter import convert_sticker
from app.services.zipper import create_sticker_zip

router = APIRouter()
settings = get_settings()

# Limit parallel conversions to prevent OOM with TGS files
MAX_PARALLEL_CONVERSIONS = 2


async def process_conversion(job_id: str):
    """Background task to process sticker conversion."""
    job = job_store.get_job(job_id)
    if not job:
        return

    # Delay to let WebSocket client connect before starting work
    # Frontend needs time to: receive response -> parse JSON -> open WebSocket
    await asyncio.sleep(1.5)

    try:
        # Extract pack name
        pack_name = await extract_pack_name(job.telegram_url)

        # Create temp directories
        temp_dir = Path(settings.temp_dir) / job_id
        download_dir = temp_dir / "download"
        output_dir = temp_dir / "output"
        download_dir.mkdir(parents=True, exist_ok=True)
        output_dir.mkdir(parents=True, exist_ok=True)

        # Update status: downloading
        await job_store.update_job(
            job_id,
            status=JobStatus.DOWNLOADING,
            progress=JobProgress(current=0, total=0, message="Starting download..."),
        )

        # Download progress callback
        async def download_progress(current: int, total: int, message: str):
            await job_store.update_job(
                job_id,
                status=JobStatus.DOWNLOADING,
                progress=JobProgress(current=current, total=total, message=message),
            )

        # Download stickers from Telegram
        pack_info = await download_sticker_pack(
            bot_token=settings.telegram_bot_token,
            pack_name=pack_name,
            output_dir=download_dir,
            progress_callback=download_progress,
        )

        pack_title = pack_info["title"]
        stickers = pack_info["stickers"]
        total_stickers = len(stickers)

        # Update status: converting
        await job_store.update_job(
            job_id,
            status=JobStatus.CONVERTING,
            progress=JobProgress(current=0, total=total_stickers, message="Starting conversion..."),
        )

        # Prepare conversion tasks
        conversion_tasks = []
        for i, sticker in enumerate(stickers):
            input_path = sticker["path"]
            output_path = output_dir / f"{i:03d}.png"
            conversion_tasks.append({
                "index": i,
                "input_path": input_path,
                "output_path": output_path,
                "is_animated": sticker["is_animated"],
                "is_video": sticker.get("is_video", False),
                "emoji": sticker["emoji"],
            })

        # Convert stickers in parallel with semaphore to limit concurrency
        semaphore = asyncio.Semaphore(MAX_PARALLEL_CONVERSIONS)
        converted_count = 0
        in_progress_count = 0
        converted_stickers = []
        lock = asyncio.Lock()

        async def convert_with_progress(task):
            nonlocal converted_count, in_progress_count

            # Update when conversion STARTS
            async with lock:
                in_progress_count += 1
                await job_store.update_job(
                    job_id,
                    status=JobStatus.CONVERTING,
                    progress=JobProgress(
                        current=converted_count,
                        total=total_stickers,
                        message=f"Converting sticker {task['index'] + 1}... ({converted_count}/{total_stickers} done)",
                    ),
                )

            async with semaphore:
                success = await convert_sticker(
                    input_path=task["input_path"],
                    output_path=task["output_path"],
                    is_animated=task["is_animated"],
                    is_video=task["is_video"],
                )

                # Update when conversion FINISHES
                async with lock:
                    converted_count += 1
                    if success:
                        converted_stickers.append({
                            "output_path": task["output_path"],
                            "emoji": task["emoji"],
                            "index": task["index"],
                        })

                    await job_store.update_job(
                        job_id,
                        status=JobStatus.CONVERTING,
                        progress=JobProgress(
                            current=converted_count,
                            total=total_stickers,
                            message=f"Converting stickers... ({converted_count}/{total_stickers} done)",
                        ),
                    )

        # Run all conversions in parallel
        await asyncio.gather(*[convert_with_progress(task) for task in conversion_tasks])

        # Sort by index to maintain order
        converted_stickers.sort(key=lambda x: x["index"])

        # Update status: zipping
        await job_store.update_job(
            job_id,
            status=JobStatus.ZIPPING,
            progress=JobProgress(current=0, total=1, message="Creating ZIP file..."),
        )

        # Create ZIP
        zip_path = await create_sticker_zip(
            pack_name=pack_title,
            stickers=converted_stickers,
            output_dir=temp_dir,
        )

        # Update status: completed
        api_url = f"/api/download/{job_id}"
        await job_store.update_job(
            job_id,
            status=JobStatus.COMPLETED,
            result=JobResult(
                download_url=api_url,
                pack_name=pack_title,
                sticker_count=len(converted_stickers),
            ),
        )

        # Clean up download directory (keep output and ZIP)
        shutil.rmtree(download_dir, ignore_errors=True)

    except Exception as e:
        await job_store.update_job(
            job_id,
            status=JobStatus.FAILED,
            error=str(e),
        )


@router.post("/convert", response_model=ConvertResponse)
async def start_conversion(
    request: ConvertRequest,
    background_tasks: BackgroundTasks,
):
    """Start a sticker pack conversion job."""
    if not settings.telegram_bot_token:
        raise HTTPException(
            status_code=500,
            detail="Telegram bot token not configured",
        )

    # Create job
    job = job_store.create_job(request.telegram_url)

    # Start background processing
    background_tasks.add_task(process_conversion, job.id)

    return ConvertResponse(job_id=job.id)


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """Get the status of a conversion job."""
    job = job_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobStatusResponse(**job.to_dict())


@router.get("/download/{job_id}")
async def download_zip(job_id: str):
    """Download the converted sticker pack ZIP."""
    job = job_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status != JobStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Job not completed")

    # Find ZIP file
    temp_dir = Path(settings.temp_dir) / job_id
    zip_files = list(temp_dir.glob("*.zip"))

    if not zip_files:
        raise HTTPException(status_code=404, detail="ZIP file not found")

    zip_path = zip_files[0]

    return FileResponse(
        zip_path,
        media_type="application/zip",
        filename=zip_path.name,
    )
