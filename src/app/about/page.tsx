import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"

export const metadata: Metadata = {
	title: "About StickerBridge",
	description:
		"Learn about StickerBridge - the free, open-source tool to convert Telegram sticker packs to Signal format. Privacy-focused, no account required.",
	alternates: {
		canonical: "https://stickerbridge.com/about",
	},
}

export default function AboutPage() {
	return (
		<div className="min-h-screen bg-background flex flex-col">
			{/* Header */}
			<header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
				<div className="container mx-auto px-4 py-4 flex items-center justify-between">
					<Link href="/" className="text-xl font-bold hover:opacity-80">
						StickerBridge
					</Link>
					<ThemeToggle />
				</div>
			</header>

			<main className="flex-1 container mx-auto px-4 py-12">
				<div className="max-w-2xl mx-auto">
					<Link
						href="/"
						className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
					>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to converter
					</Link>

					<h1 className="text-4xl font-bold mb-6">About StickerBridge</h1>

					<div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
						<p className="text-lg text-muted-foreground">
							StickerBridge is a free, open-source tool that converts Telegram sticker packs to
							Signal-compatible format.
						</p>

						<h2 className="text-2xl font-semibold mt-8 mb-4">Why we built this</h2>
						<p className="text-muted-foreground">
							Signal is a fantastic privacy-focused messenger, but its sticker ecosystem is
							smaller than Telegram's. We wanted to bridge that gap and let Signal users enjoy
							the vast library of Telegram stickers.
						</p>

						<h2 className="text-2xl font-semibold mt-8 mb-4">How it works</h2>
						<p className="text-muted-foreground">
							When you paste a Telegram sticker pack URL, our server downloads the stickers using
							the Telegram Bot API, converts them to Signal's required format (APNG for animated,
							PNG for static), optimizes them to fit under Signal's 300KB limit, and packages
							them into a ZIP file for you to download.
						</p>

						<h2 className="text-2xl font-semibold mt-8 mb-4">Supported formats</h2>
						<ul className="list-disc pl-6 text-muted-foreground space-y-2">
							<li>
								<strong>Static stickers (WebP)</strong> - Converted to PNG
							</li>
							<li>
								<strong>Animated stickers (TGS)</strong> - Lottie animations converted to APNG
							</li>
							<li>
								<strong>Video stickers (WebM)</strong> - Converted to APNG using FFmpeg
							</li>
						</ul>

						<h2 className="text-2xl font-semibold mt-8 mb-4">Privacy</h2>
						<p className="text-muted-foreground">
							We don't store your data. Converted stickers are temporarily cached and
							automatically deleted after one hour. We don't track users, require accounts, or
							collect any personal information.
						</p>

						<h2 className="text-2xl font-semibold mt-8 mb-4">Open Source</h2>
						<p className="text-muted-foreground">
							StickerBridge is open source. You can view the code, report issues, or contribute
							on GitHub.
						</p>
					</div>
				</div>
			</main>

			{/* Footer */}
			<footer className="border-t mt-auto">
				<div className="container mx-auto px-4 py-8">
					<div className="flex flex-col md:flex-row items-center justify-between gap-4">
						<span className="font-semibold">StickerBridge</span>
						<p className="text-sm text-muted-foreground text-center">
							All stickers converted to APNG/PNG format optimized for Signal (&lt;300KB)
						</p>
						<div className="text-sm text-muted-foreground">Open Source</div>
					</div>
				</div>
			</footer>
		</div>
	)
}
