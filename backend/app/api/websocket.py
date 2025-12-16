import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.jobs import job_store

router = APIRouter()


@router.websocket("/ws/jobs/{job_id}")
async def websocket_job_progress(websocket: WebSocket, job_id: str):
    """WebSocket endpoint for real-time job progress updates."""
    await websocket.accept()

    job = job_store.get_job(job_id)
    if not job:
        await websocket.send_json({"type": "error", "error": "Job not found"})
        await websocket.close()
        return

    # Send current status immediately
    await websocket.send_json({
        "type": "progress",
        "status": job.status.value,
        "current": job.progress.current,
        "total": job.progress.total,
        "message": job.progress.message,
    })

    # Subscribe to updates
    async def send_update(message: dict):
        try:
            await websocket.send_json(message)
        except Exception:
            pass

    job.subscribers.append(send_update)

    try:
        # Keep connection alive until client disconnects or job completes
        while True:
            # Wait for messages from client (ping/pong or close)
            try:
                data = await websocket.receive_text()
                # Client can send "ping" to keep alive
                if data == "ping":
                    await websocket.send_text("pong")
            except WebSocketDisconnect:
                break

    finally:
        # Unsubscribe on disconnect
        if send_update in job.subscribers:
            job.subscribers.remove(send_update)
