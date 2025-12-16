# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

StickerBridge is a web app that converts Telegram sticker packs to Signal-ready format. Users paste a Telegram sticker pack URL, the app downloads and converts the stickers, then provides a ZIP download that can be imported into Signal Desktop.

### Architecture

- **Frontend**: Next.js 15 with React 19, Tailwind CSS v4, shadcn/ui
- **Backend**: Python FastAPI for conversion (required for TGS→APNG conversion libraries)
- **Real-time**: WebSocket for progress updates
- **Container**: Docker Compose orchestrates both services

## Development Commands

```bash
# Frontend
npm install              # Install dependencies
npm run dev              # Start Next.js dev server (port 3000)
npm run build            # Build for production
npm run lint             # Check code with Biome
npm run lint:fix         # Auto-fix linting issues

# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Full Stack (Docker)
docker compose up --build    # Build and start all services
docker compose up -d         # Start in background
docker compose down          # Stop services
```

## Project Structure

```
StickerBridge/
├── src/                          # Next.js frontend
│   ├── app/
│   │   ├── page.tsx              # Main converter UI
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   ├── components/ui/            # shadcn/ui components
│   └── lib/utils.ts              # Utility functions
│
├── backend/                      # FastAPI Python backend
│   ├── app/
│   │   ├── main.py               # FastAPI entry point, CORS config
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── convert.py    # POST /api/convert, GET /api/jobs, GET /api/download
│   │   │   │   └── health.py     # GET /health
│   │   │   └── websocket.py      # WS /ws/jobs/{job_id}
│   │   ├── services/
│   │   │   ├── telegram.py       # Download stickers via Bot API
│   │   │   ├── converter.py      # TGS→APNG conversion logic
│   │   │   └── zipper.py         # Create downloadable ZIP
│   │   ├── models/
│   │   │   └── schemas.py        # Pydantic request/response models
│   │   └── core/
│   │       ├── config.py         # Settings (env vars)
│   │       └── jobs.py           # In-memory job store with TTL
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml            # Container orchestration
├── Dockerfile                    # Frontend container
├── .env.example                  # Environment template
└── README.md                     # User documentation
```

## Key Concepts

### Conversion Pipeline

1. **URL Validation**: Extract pack name from Telegram URL formats
2. **Download**: Use Telegram Bot API to fetch sticker files
3. **Convert**:
   - Static (WebP): Convert to PNG, resize to 512x512
   - Animated (TGS): Decompress, render with rlottie, encode as APNG
4. **Optimize**: Binary search for quality to stay under Signal's 300KB limit
5. **Package**: Create ZIP with numbered files

### Job Lifecycle

Jobs progress through states: `queued` → `downloading` → `converting` → `zipping` → `completed` (or `failed`)

Each state broadcasts progress via WebSocket for real-time UI updates.

### Signal Constraints

- Max file size: 300KB per sticker
- Max dimensions: 512x512 pixels
- Format: APNG for animated, PNG for static
- Pack must be imported manually via Signal Desktop

## API Reference

```
POST /api/convert
  Request: { "telegram_url": "https://t.me/addstickers/PackName" }
  Response: { "job_id": "uuid" }

GET /api/jobs/{job_id}
  Response: { "status": "...", "progress": {...}, "result": {...} }

GET /api/download/{job_id}
  Response: application/zip

WS /ws/jobs/{job_id}
  Messages: JSON progress updates
```

## Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | Backend | Telegram Bot API token (required) |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend URL (default: http://localhost:8000) |

## Important Libraries

### Backend (Python)

- `python-telegram-bot`: Telegram Bot API client
- `rlottie-python`: Render Lottie/TGS animations
- `apngasm-python`: Assemble frames into APNG
- `Pillow`: Image processing and format conversion
- `pyoxipng`: PNG optimization

### Frontend

- `shadcn/ui`: Pre-built accessible components
- Native WebSocket API for progress updates

## Common Tasks

### Adding a new API endpoint

1. Create route in `backend/app/api/routes/`
2. Register router in `backend/app/main.py`
3. Add Pydantic models to `backend/app/models/schemas.py`

### Modifying the UI

1. Main converter UI is in `src/app/page.tsx`
2. Add shadcn components: `npx shadcn@latest add [component]`
3. Components live in `src/components/ui/`

### Adjusting conversion settings

- Quality settings: `backend/app/services/converter.py`
- File size targets: Modify `target_size` parameter (default 300KB)
- FPS limits: Adjust in converter for animated stickers

## Notes

- No user accounts or database needed - jobs are stored in memory with 1-hour TTL
- Telegram bot token is server-side only - never exposed to frontend
- WebSocket connection auto-reconnects on disconnect
- ZIP files are served directly from the backend, not stored persistently
