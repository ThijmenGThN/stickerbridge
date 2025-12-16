import asyncio
import re
from pathlib import Path
from telegram import Bot
from telegram.error import TelegramError


async def extract_pack_name(url: str) -> str:
    """Extract pack name from Telegram URL"""
    match = re.search(r"addstickers[?/](?:set=)?([\w]+)", url, re.IGNORECASE)
    if not match:
        raise ValueError("Could not extract pack name from URL")
    return match.group(1)


async def download_sticker_pack(
    bot_token: str,
    pack_name: str,
    output_dir: Path,
    progress_callback=None,
) -> dict:
    """
    Download all stickers from a Telegram sticker pack.

    Returns dict with:
        - title: Pack title
        - stickers: List of {path: Path, emoji: str, is_animated: bool}
    """
    bot = Bot(token=bot_token)

    try:
        sticker_set = await bot.get_sticker_set(pack_name)
    except TelegramError as e:
        raise ValueError(f"Failed to get sticker pack: {e}")

    output_dir.mkdir(parents=True, exist_ok=True)

    total = len(sticker_set.stickers)
    stickers = []

    for i, sticker in enumerate(sticker_set.stickers):
        # Get file info
        file = await bot.get_file(sticker.file_id)

        # Determine file extension
        if sticker.is_animated:
            ext = ".tgs"
        elif sticker.is_video:
            ext = ".webm"
        else:
            ext = ".webp"

        # Download file
        file_path = output_dir / f"{i:03d}{ext}"
        await file.download_to_drive(file_path)

        stickers.append({
            "path": file_path,
            "emoji": sticker.emoji or "😀",
            "is_animated": sticker.is_animated,
            "is_video": sticker.is_video,
        })

        if progress_callback:
            await progress_callback(i + 1, total, f"Downloaded {i + 1}/{total}")

    return {
        "title": sticker_set.title,
        "name": sticker_set.name,
        "stickers": stickers,
    }
