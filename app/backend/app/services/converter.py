"""
Telegram sticker to Signal APNG converter.

Supports:
- TGS (Lottie) -> APNG using rlottie-python
- WebM (video) -> APNG using FFmpeg
- WebP (static) -> PNG using Pillow
"""

import asyncio
import logging
import shutil
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
from pathlib import Path
from PIL import Image

logger = logging.getLogger(__name__)

# Thread pool for running conversions in parallel (TGS, WebM, WebP)
_executor = ThreadPoolExecutor(max_workers=8)

# rlottie is used in tgs_worker.py subprocess

try:
    import oxipng
    HAS_OXIPNG = True
except ImportError:
    HAS_OXIPNG = False
    logger.warning("oxipng not available")


# Signal's sticker requirements
MAX_SIZE_BYTES = 300_000  # 300 KB
MAX_DIMENSION = 512


def pad_to_square(img: Image.Image, size: int = MAX_DIMENSION) -> Image.Image:
    """Pad an image to a square with transparent background, centered."""
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    width, height = img.size

    # If already square and correct size, return as-is
    if width == height == size:
        return img

    # Scale down if larger than target size
    if width > size or height > size:
        scale = min(size / width, size / height)
        new_width = int(width * scale)
        new_height = int(height * scale)
        img = img.resize((new_width, new_height), Image.LANCZOS)
        width, height = img.size

    # Create square canvas with transparent background
    square = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    # Center the image
    x = (size - width) // 2
    y = (size - height) // 2
    square.paste(img, (x, y), img)

    return square


def _convert_tgs_to_apng_subprocess(
    tgs_path: Path,
    output_path: Path,
) -> bool:
    """
    TGS to APNG conversion using subprocess for crash isolation.
    rlottie can segfault on certain files - subprocess prevents main process crash.
    """
    import sys
    worker_script = Path(__file__).parent / "tgs_worker.py"

    try:
        result = subprocess.run(
            [sys.executable, str(worker_script), str(tgs_path), str(output_path)],
            capture_output=True,
            text=True,
            timeout=60,  # 60 second timeout per sticker
        )

        if result.returncode == 0 and output_path.exists():
            logger.info(f"TGS converted: {output_path.name}")
            return True
        else:
            logger.warning(f"TGS conversion failed: {tgs_path.name} (exit code {result.returncode})")
            if result.stdout:
                logger.warning(f"stdout: {result.stdout}")
            if result.stderr:
                logger.warning(f"stderr: {result.stderr}")
            if result.returncode == -11:
                logger.error("SIGSEGV detected - rlottie crashed. This may be a library compatibility issue.")
            return False

    except subprocess.TimeoutExpired:
        logger.warning(f"TGS conversion timed out: {tgs_path.name}")
        return False
    except Exception as e:
        logger.exception(f"TGS conversion error: {e}")
        return False


async def convert_tgs_to_apng(
    tgs_path: Path,
    output_path: Path,
    target_size: int = MAX_SIZE_BYTES,
    max_dimension: int = MAX_DIMENSION,
) -> bool:
    """Async wrapper - runs TGS conversion in subprocess for crash isolation."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        _executor,
        _convert_tgs_to_apng_subprocess,
        tgs_path,
        output_path,
    )


def _convert_webp_to_png_sync(
    webp_path: Path,
    output_path: Path,
    max_dimension: int = MAX_DIMENSION,
) -> bool:
    """Synchronous WebP to PNG conversion."""
    try:
        img = Image.open(webp_path)

        # Convert to RGBA if needed
        if img.mode != "RGBA":
            img = img.convert("RGBA")

        # Pad to square (also scales if needed)
        img = pad_to_square(img, max_dimension)

        # Save as PNG
        buffer = BytesIO()
        img.save(buffer, format="PNG", optimize=True)

        png_bytes = buffer.getvalue()

        # Optimize with oxipng
        if HAS_OXIPNG:
            try:
                png_bytes = oxipng.optimize_from_memory(png_bytes, level=2)
            except:
                pass

        output_path.write_bytes(png_bytes)
        logger.info(f"Converted: {output_path.name} ({len(png_bytes)} bytes)")
        return True

    except Exception as e:
        logger.exception(f"WebP conversion failed: {e}")
        return False


async def convert_webp_to_png(
    webp_path: Path,
    output_path: Path,
    max_dimension: int = MAX_DIMENSION,
) -> bool:
    """Async wrapper for WebP conversion."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        _executor,
        _convert_webp_to_png_sync,
        webp_path,
        output_path,
        max_dimension,
    )


def create_apng_pillow(frames: list[Image.Image], delay_ms: int) -> bytes:
    """Create APNG using Pillow's native support."""
    buffer = BytesIO()
    frames[0].save(
        buffer,
        format="PNG",
        save_all=True,
        append_images=frames[1:] if len(frames) > 1 else [],
        duration=delay_ms,
        loop=0,
    )
    return buffer.getvalue()


def _convert_webm_to_apng_sync(
    webm_path: Path,
    output_path: Path,
    target_size: int = MAX_SIZE_BYTES,
    max_dimension: int = MAX_DIMENSION,
) -> bool:
    """
    Synchronous WebM to APNG conversion (runs in thread pool).
    Optimized for speed - starts with aggressive compression.
    """
    try:
        # Get source file size to estimate compression needed
        source_size = webm_path.stat().st_size

        # Video stickers are typically 50-200KB as WebM but expand massively as APNG
        # Start aggressive: 256px @ 8fps for most, smaller for larger sources
        if source_size > 100_000:  # > 100KB source
            initial_dim = 192
            initial_fps = 5
        elif source_size > 50_000:  # > 50KB source
            initial_dim = 256
            initial_fps = 8
        else:
            initial_dim = 320
            initial_fps = 10

        # Settings to try: (dimension, fps) - from aggressive to less aggressive
        settings = [
            (initial_dim, initial_fps),
            (192, 8),
            (192, 5),
            (160, 8),
            (160, 5),
            (128, 8),
            (128, 5),
            (128, 3),
            (96, 5),
            (96, 3),
        ]

        for max_dim, fps in settings:
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                tmp_path = tmp.name

            # Scale to fit within max_dim, then pad to square with transparent background
            # The pad filter centers the image and fills with transparent color
            vf = (
                f"fps={fps},"
                f"scale={max_dim}:{max_dim}:force_original_aspect_ratio=decrease,"
                f"pad={max_dim}:{max_dim}:(ow-iw)/2:(oh-ih)/2:color=0x00000000"
            )
            ffmpeg_cmd = [
                "ffmpeg", "-y", "-v", "error",
                "-i", str(webm_path),
                "-vf", vf,
                "-plays", "0",
                "-f", "apng",
                tmp_path
            ]

            result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
            if result.returncode != 0:
                # Try with format specifier for transparency
                vf = (
                    f"fps={fps},"
                    f"scale={max_dim}:{max_dim}:force_original_aspect_ratio=decrease,"
                    f"pad={max_dim}:{max_dim}:-1:-1:color=black@0"
                )
                ffmpeg_cmd = [
                    "ffmpeg", "-y", "-v", "error",
                    "-i", str(webm_path),
                    "-vf", vf,
                    "-plays", "0",
                    "-f", "apng",
                    tmp_path
                ]
                result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
                if result.returncode != 0:
                    Path(tmp_path).unlink(missing_ok=True)
                    continue

            tmp_file = Path(tmp_path)
            if not tmp_file.exists():
                continue

            file_size = tmp_file.stat().st_size

            if file_size <= target_size:
                # Optimize with oxipng if available
                if HAS_OXIPNG:
                    try:
                        apng_bytes = tmp_file.read_bytes()
                        apng_bytes = oxipng.optimize_from_memory(apng_bytes, level=2)
                        output_path.write_bytes(apng_bytes)
                        tmp_file.unlink()
                        logger.info(f"Converted: {output_path.name} ({len(apng_bytes)} bytes, {max_dim}px, {fps}fps)")
                        return True
                    except:
                        pass

                shutil.move(str(tmp_file), str(output_path))
                logger.info(f"Converted: {output_path.name} ({file_size} bytes, {max_dim}px, {fps}fps)")
                return True

            tmp_file.unlink(missing_ok=True)

        logger.warning(f"Failed to compress {webm_path.name} under 300KB")
        return False

    except Exception as e:
        logger.exception(f"WebM conversion failed: {e}")
        return False


async def convert_webm_to_apng(
    webm_path: Path,
    output_path: Path,
    target_size: int = MAX_SIZE_BYTES,
    max_dimension: int = MAX_DIMENSION,
) -> bool:
    """Async wrapper - runs conversion in thread pool for true parallelism."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        _executor,
        _convert_webm_to_apng_sync,
        webm_path,
        output_path,
        target_size,
        max_dimension,
    )


async def convert_sticker(
    input_path: Path,
    output_path: Path,
    is_animated: bool = False,
    is_video: bool = False,
) -> bool:
    """
    Convert a single sticker to Signal-compatible format.
    """
    logger.info(f"Converting: {input_path} (animated={is_animated}, video={is_video})")

    if is_animated:
        # TGS -> APNG
        output_path = output_path.with_suffix(".png")
        return await convert_tgs_to_apng(input_path, output_path)
    elif is_video:
        # WebM -> APNG
        output_path = output_path.with_suffix(".png")
        return await convert_webm_to_apng(input_path, output_path)
    else:
        # WebP -> PNG
        output_path = output_path.with_suffix(".png")
        return await convert_webp_to_png(input_path, output_path)
