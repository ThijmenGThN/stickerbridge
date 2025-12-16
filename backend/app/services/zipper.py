"""ZIP packaging service for converted stickers."""

import zipfile
from io import BytesIO
from pathlib import Path


README_TEMPLATE = """# {pack_name}

This sticker pack was converted from Telegram to Signal format using StickerBridge.

## How to Import to Signal

1. Open Signal Desktop
2. Click on the sticker icon in any chat
3. Click the "+" button to create a new pack
4. Drag and drop the PNG files from this ZIP
5. Add emojis for each sticker (suggested emojis are in the filename)
6. Upload the pack

## Sticker Files

{sticker_list}

## Notes

- All stickers have been converted to APNG/PNG format
- File sizes are optimized to be under 300KB (Signal's limit)
- Original emojis from Telegram are included in the filenames

Enjoy your stickers!
"""


async def create_sticker_zip(
    pack_name: str,
    stickers: list[dict],
    output_dir: Path,
) -> Path:
    """
    Create a ZIP file containing converted stickers and README.

    Args:
        pack_name: Name of the sticker pack
        stickers: List of dicts with 'output_path' and 'emoji' keys
        output_dir: Directory to save the ZIP file

    Returns:
        Path to the created ZIP file
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    # Clean pack name for filename
    safe_name = "".join(c if c.isalnum() or c in "-_ " else "_" for c in pack_name)
    safe_name = safe_name.strip().replace(" ", "_")

    zip_path = output_dir / f"StickerBridge-{safe_name}.zip"

    # Build sticker list for README
    sticker_list_lines = []
    for i, sticker in enumerate(stickers):
        if sticker.get("output_path") and sticker["output_path"].exists():
            emoji = sticker.get("emoji", "😀")
            filename = sticker["output_path"].name
            sticker_list_lines.append(f"- {filename} ({emoji})")

    sticker_list = "\n".join(sticker_list_lines) if sticker_list_lines else "No stickers converted."

    # Create README content
    readme_content = README_TEMPLATE.format(
        pack_name=pack_name,
        sticker_list=sticker_list,
    )

    # Create ZIP file
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        # Add README
        zf.writestr(f"{safe_name}/README.txt", readme_content)

        # Track emoji usage for handling duplicates
        emoji_counts: dict[str, int] = {}

        # Add stickers with emoji as filename
        for sticker in stickers:
            output_path = sticker.get("output_path")
            if output_path and output_path.exists():
                emoji = sticker.get("emoji", "😀")
                ext = output_path.suffix

                # Handle duplicate emojis by adding a suffix
                if emoji in emoji_counts:
                    emoji_counts[emoji] += 1
                    filename = f"{emoji}_{emoji_counts[emoji]}{ext}"
                else:
                    emoji_counts[emoji] = 1
                    filename = f"{emoji}{ext}"

                arcname = f"{safe_name}/{filename}"
                zf.write(output_path, arcname)

    return zip_path
