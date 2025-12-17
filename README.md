# StickerBridge

Convert your favorite Telegram sticker packs to Signal in seconds.

<p align="center">
  <img src="public/HowTo.gif" alt="StickerBridge Demo">
</p>



## What is StickerBridge?

StickerBridge is a simple web app that converts Telegram sticker packs to a format compatible with Signal. Just paste a link, click convert, and download your stickers — no accounts or technical knowledge required.



### Key Features

- **One-Click Conversion** — Paste a Telegram sticker URL and download a ready-to-import ZIP
- **Animated Sticker Support** — Converts animated TGS stickers to Signal-compatible APNG
- **Optimized Output** — Automatically compresses stickers to meet Signal's 300KB limit
- **Self-Hostable** — Run your own instance with Docker



## How to Use

1. Find a Telegram sticker pack you want to convert
2. Copy its URL (e.g., `https://t.me/addstickers/PackName`)
3. Paste the URL into StickerBridge and click **Convert**
4. Download the ZIP file once conversion completes
5. Open Signal Desktop → `File` → `Create/Upload Sticker Pack`
6. Import your stickers and enjoy!



## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started) with Docker Compose
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

3. **Start StickerBridge**
   ```bash
   docker compose up -d
   ```

4. **Open your browser** at [http://localhost:3000](http://localhost:3000)



## Supported URL Formats

| Format | Example |
|--------|---------|
| t.me | `https://t.me/addstickers/PackName` |
| telegram.me | `https://telegram.me/addstickers/PackName` |
| telegram.dog | `https://telegram.dog/addstickers/PackName` |
| tg:// | `tg://addstickers?set=PackName` |



## Limitations

- Only public sticker packs are supported
- Animated stickers may lose some quality to meet Signal's size limits
- Custom emoji packs are not supported (stickers only)



## Credits

Conversion logic inspired by [sticker-convert](https://github.com/laggykiller/sticker-convert).



<details>
<summary><strong>Development & Contributing</strong></summary>

### Project Structure

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
| Real-time | WebSocket |
| Container | Docker, Docker Compose |

### Development Commands

**Frontend**
```bash
npm install              # Install dependencies
npm run dev              # Start dev server (port 3000)
npm run build            # Build for production
npm run lint             # Check code with Biome
npm run lint:fix         # Auto-fix linting issues
```

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Full Stack (Docker)**
```bash
docker compose up --build    # Build and start all services
docker compose down          # Stop services
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API token | Yes |
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: http://localhost:8000) | No |

### API Reference

```
POST /api/convert
  Body: { "telegram_url": "https://t.me/addstickers/PackName" }
  Response: { "job_id": "uuid" }

GET /api/jobs/{job_id}
  Response: { "status": "...", "progress": {...}, "result": {...} }

GET /api/download/{job_id}
  Response: ZIP file

WS /ws/jobs/{job_id}
  Messages: JSON progress updates
```

### How Conversion Works

1. **Download** — Fetches sticker pack metadata and files via Telegram Bot API
2. **Detect Format** — Identifies static (WebP/PNG) vs animated (TGS) stickers
3. **Convert** — Static: WebP → PNG (512x512) | Animated: TGS → APNG (optimized for 300KB)
4. **Package** — Creates ZIP with numbered files ready for Signal import

### Contributing

Found a bug or have an idea? [Open an issue](https://github.com/yourusername/StickerBridge/issues) — contributions are welcome!

</details>



## License

MIT License
