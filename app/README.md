# StickerBridge

Convert Telegram sticker packs to Signal-ready format with ease.

## What It Does

Paste a Telegram sticker pack URL, click convert, and download a ZIP file ready to import into Signal Desktop.

```
Telegram Sticker Pack → StickerBridge → ZIP File → Import to Signal
```

## Features

- **No accounts required** - Just paste a URL and download
- **Animated sticker support** - Converts TGS (Telegram animated) to APNG (Signal format)
- **Optimized for Signal** - Auto-compresses to meet Signal's 300KB limit
- **Real-time progress** - WebSocket-powered progress updates
- **Self-hostable** - Run your own instance with Docker

## Quick Start

### Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose
- A Telegram Bot Token (get one from [@BotFather](https://t.me/BotFather))

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/StickerBridge.git
   cd StickerBridge
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Telegram bot token:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   ```

3. **Start the services**
   ```bash
   docker compose up -d
   ```

4. **Open your browser**

   Visit [http://localhost:3000](http://localhost:3000)

## Usage

1. Find a Telegram sticker pack you want to convert
2. Copy the sticker pack URL (e.g., `https://t.me/addstickers/PackName`)
3. Paste it into StickerBridge
4. Click **Convert**
5. Wait for conversion to complete
6. Click **Download ZIP**
7. Import to Signal Desktop: `File → Create/Upload Sticker Pack`

## Supported URL Formats

```
https://t.me/addstickers/{pack_name}
https://telegram.me/addstickers/{pack_name}
https://telegram.dog/addstickers/{pack_name}
tg://addstickers?set={pack_name}
```

## Architecture

```
StickerBridge/
├── src/                    # Next.js 15 frontend
│   ├── app/
│   │   └── page.tsx        # Main converter UI
│   └── components/ui/      # shadcn/ui components
│
├── backend/                # FastAPI Python backend
│   └── app/
│       ├── main.py         # FastAPI entry point
│       ├── api/            # REST + WebSocket endpoints
│       ├── services/       # Telegram download, conversion, ZIP
│       └── core/           # Config and job management
│
└── docker-compose.yml      # Container orchestration
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS v4, shadcn/ui |
| Backend | FastAPI, Python 3.11 |
| Conversion | rlottie-python, apngasm-python, Pillow |
| Real-time | WebSocket (native FastAPI) |
| Container | Docker, Docker Compose |

## API Endpoints

```
POST /api/convert
  Body: { "telegram_url": "https://t.me/addstickers/PackName" }
  Response: { "job_id": "uuid" }

GET /api/jobs/{job_id}
  Response: {
    "status": "queued" | "downloading" | "converting" | "zipping" | "completed" | "failed",
    "progress": { "current": 5, "total": 30, "message": "Converting sticker 5/30" },
    "result": { "download_url": "/api/download/uuid", "pack_name": "...", "sticker_count": 30 }
  }

GET /api/download/{job_id}
  Response: ZIP file

WS /ws/jobs/{job_id}
  Messages: progress updates, completion, or failure notifications
```

## Development

### Frontend Only

```bash
npm install
npm run dev
```

The frontend runs on [http://localhost:3000](http://localhost:3000).

### Backend Only

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The backend runs on [http://localhost:8000](http://localhost:8000).

### Full Stack (Docker)

```bash
docker compose up --build
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API token | Yes |
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: http://localhost:8000) | No |

## How Conversion Works

1. **Download**: Fetches sticker pack metadata and files via Telegram Bot API
2. **Detect Format**: Identifies static (WebP/PNG) vs animated (TGS) stickers
3. **Convert**:
   - Static: WebP → PNG (resized to 512x512)
   - Animated: TGS → APNG using rlottie (binary search for optimal quality under 300KB)
4. **Package**: Creates ZIP with numbered files and emoji mapping

## Limitations

- Only public sticker packs are supported
- Maximum pack size limited by Telegram API
- Animated stickers may lose some quality to meet Signal's 300KB limit
- Custom emoji packs not supported (stickers only)

## Credits

Conversion logic inspired by [sticker-convert](https://github.com/laggykiller/sticker-convert).

## License

MIT License
