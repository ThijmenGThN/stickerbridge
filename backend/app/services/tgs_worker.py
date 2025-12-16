#!/usr/bin/env python3
"""
Subprocess worker for TGS to APNG conversion.
Uses rlottie-python with render_pillow_frame for reliable frame rendering.
"""

import sys
from pathlib import Path
from io import BytesIO

try:
    from rlottie_python import LottieAnimation
    HAS_RLOTTIE = True
except ImportError as e:
    HAS_RLOTTIE = False
    print(f"rlottie import error: {e}", file=sys.stderr)

try:
    import oxipng
    HAS_OXIPNG = True
except ImportError:
    HAS_OXIPNG = False

from PIL import Image


def pad_to_square(img: Image.Image, size: int) -> Image.Image:
    """Pad an image to a square with transparent background, centered."""
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    width, height = img.size
    if width == height == size:
        return img

    if width > size or height > size:
        scale = min(size / width, size / height)
        new_width = int(width * scale)
        new_height = int(height * scale)
        img = img.resize((new_width, new_height), Image.LANCZOS)
        width, height = img.size

    square = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    x = (size - width) // 2
    y = (size - height) // 2
    square.paste(img, (x, y), img)
    return square


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


def convert_tgs(tgs_path: str, output_path: str, target_size: int = 300000, max_dimension: int = 512) -> bool:
    """Convert TGS to APNG using rlottie-python."""
    if not HAS_RLOTTIE:
        print("rlottie not available", file=sys.stderr)
        return False

    try:
        print(f"Loading TGS: {tgs_path}", file=sys.stderr)

        # Load the animation
        anim = LottieAnimation.from_tgs(tgs_path)

        # Get animation properties
        frame_count = anim.lottie_animation_get_totalframe()
        fps = anim.lottie_animation_get_framerate()
        width, height = anim.lottie_animation_get_size()

        print(f"Animation: {frame_count} frames, {fps} fps, {width}x{height}", file=sys.stderr)

        # Calculate scale to fit in max_dimension
        scale = min(max_dimension / width, max_dimension / height, 1.0)
        new_width = int(width * scale)
        new_height = int(height * scale)

        # Make dimensions even (required by rlottie)
        new_width = new_width if new_width % 2 == 0 else new_width - 1
        new_height = new_height if new_height % 2 == 0 else new_height - 1

        # Try different settings until we get under 300KB
        # Settings: (render_dim, num_frames, fps)
        settings = [
            (512, 20, 16),   # Best quality
            (512, 16, 12),   # Fewer frames
            (400, 16, 12),   # Smaller render
            (320, 14, 10),   # More compression
            (256, 12, 10),   # Heavy compression
            (200, 10, 8),    # Maximum compression
        ]

        best_result = None

        for render_dim, max_frames, target_fps in settings:
            # Make dimension even
            render_dim = render_dim if render_dim % 2 == 0 else render_dim - 1

            # Calculate frames to render
            frame_skip = max(1, int(fps / target_fps))
            frames_to_render = list(range(0, frame_count, frame_skip))

            if len(frames_to_render) > max_frames:
                step = max(1, len(frames_to_render) // max_frames)
                frames_to_render = frames_to_render[::step][:max_frames]

            print(f"Trying {render_dim}px, {len(frames_to_render)} frames, {target_fps}fps", file=sys.stderr)

            frames = []
            for frame_num in frames_to_render:
                img = anim.render_pillow_frame(frame_num=frame_num, width=render_dim, height=render_dim)
                # Always pad to 512x512 for Signal
                img = pad_to_square(img, 512)
                frames.append(img)

            if not frames:
                continue

            delay_ms = int(1000 / target_fps)
            apng_bytes = create_apng_pillow(frames, delay_ms)

            if HAS_OXIPNG:
                try:
                    apng_bytes = oxipng.optimize_from_memory(apng_bytes, level=3)
                except Exception:
                    pass

            print(f"Result: {len(apng_bytes)} bytes ({len(apng_bytes)/1000:.0f}KB)", file=sys.stderr)

            if len(apng_bytes) <= target_size:
                best_result = apng_bytes
                break
            elif best_result is None or len(apng_bytes) < len(best_result):
                best_result = apng_bytes

        if best_result:
            if len(best_result) > target_size:
                print(f"Warning: could not compress under {target_size/1000:.0f}KB, got {len(best_result)/1000:.0f}KB", file=sys.stderr)
            Path(output_path).write_bytes(best_result)
            print(f"Success: wrote {len(best_result)} bytes", file=sys.stderr)
            return True

        print("Failed: no frames rendered", file=sys.stderr)
        return False

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return False


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: tgs_worker.py <input.tgs> <output.png>", file=sys.stderr)
        sys.exit(1)

    print(f"TGS Worker starting: {sys.argv[1]} -> {sys.argv[2]}", file=sys.stderr)
    print(f"rlottie available: {HAS_RLOTTIE}", file=sys.stderr)
    print(f"oxipng available: {HAS_OXIPNG}", file=sys.stderr)

    success = convert_tgs(sys.argv[1], sys.argv[2])
    print(f"Conversion {'successful' if success else 'failed'}", file=sys.stderr)
    sys.exit(0 if success else 1)
