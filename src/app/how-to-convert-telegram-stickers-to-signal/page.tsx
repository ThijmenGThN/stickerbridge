import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
	title: "How to Convert Telegram Stickers to Signal - Step by Step Guide",
	description:
		"Complete guide on how to convert Telegram sticker packs to Signal format. Learn to transfer your favorite animated and static stickers from Telegram to Signal messenger.",
	keywords: [
		"how to convert telegram stickers to signal",
		"telegram to signal stickers",
		"transfer stickers telegram signal",
		"import telegram stickers signal",
		"telegram stickers on signal",
	],
	alternates: {
		canonical: "https://stickerbridge.com/how-to-convert-telegram-stickers-to-signal",
	},
}

const jsonLd = {
	"@context": "https://schema.org",
	"@type": "HowTo",
	name: "How to Convert Telegram Stickers to Signal",
	description:
		"A step-by-step guide to convert Telegram sticker packs to Signal-compatible format using StickerBridge.",
	totalTime: "PT5M",
	tool: [
		{
			"@type": "HowToTool",
			name: "StickerBridge",
		},
		{
			"@type": "HowToTool",
			name: "Signal Desktop",
		},
	],
	step: [
		{
			"@type": "HowToStep",
			name: "Find the Telegram sticker pack URL",
			text: "Open Telegram, tap on any sticker from the pack you want, tap the pack name, and copy the share link.",
			position: 1,
		},
		{
			"@type": "HowToStep",
			name: "Paste the URL into StickerBridge",
			text: "Go to StickerBridge.com and paste the Telegram sticker pack URL into the input field.",
			position: 2,
		},
		{
			"@type": "HowToStep",
			name: "Convert the sticker pack",
			text: "Click the Convert button and wait for the conversion to complete. This usually takes less than a minute.",
			position: 3,
		},
		{
			"@type": "HowToStep",
			name: "Download the ZIP file",
			text: "Once conversion is complete, download the ZIP file containing all converted stickers.",
			position: 4,
		},
		{
			"@type": "HowToStep",
			name: "Import into Signal Desktop",
			text: "Open Signal Desktop, go to File > Create/Upload Sticker Pack, add the stickers from the ZIP, assign emojis, and upload.",
			position: 5,
		},
	],
}

export default function HowToPage() {
	return (
		<div className="min-h-screen bg-background flex flex-col">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>

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
				<article className="max-w-2xl mx-auto">
					<Link
						href="/"
						className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
					>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to converter
					</Link>

					<h1 className="text-4xl font-bold mb-4">
						How to Convert Telegram Stickers to Signal
					</h1>
					<p className="text-xl text-muted-foreground mb-8">
						A complete step-by-step guide to transfer your favorite Telegram sticker packs to
						Signal messenger.
					</p>

					<div className="prose prose-neutral dark:prose-invert max-w-none">
						<h2 className="text-2xl font-semibold mt-8 mb-4">What You'll Need</h2>
						<ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-8">
							<li>A Telegram sticker pack URL</li>
							<li>Signal Desktop installed on your computer</li>
							<li>About 5 minutes of your time</li>
						</ul>

						<h2 className="text-2xl font-semibold mt-8 mb-4">
							Step 1: Find the Telegram Sticker Pack URL
						</h2>
						<p className="text-muted-foreground mb-4">
							First, you need to get the link to the Telegram sticker pack you want to convert:
						</p>
						<ol className="list-decimal pl-6 text-muted-foreground space-y-2 mb-8">
							<li>Open Telegram on your phone or computer</li>
							<li>Find a sticker from the pack you want to convert</li>
							<li>Tap or click on the sticker</li>
							<li>Tap the sticker pack name at the top</li>
							<li>Look for the "Share" or "Copy Link" option</li>
							<li>
								The URL will look like: <code>https://t.me/addstickers/PackName</code>
							</li>
						</ol>

						<h2 className="text-2xl font-semibold mt-8 mb-4">
							Step 2: Convert with StickerBridge
						</h2>
						<p className="text-muted-foreground mb-4">
							Now use StickerBridge to convert the stickers:
						</p>
						<ol className="list-decimal pl-6 text-muted-foreground space-y-2 mb-8">
							<li>Go to the StickerBridge converter (link below)</li>
							<li>Paste the Telegram sticker pack URL</li>
							<li>Click "Convert to Signal"</li>
							<li>Wait for the conversion to complete (usually under a minute)</li>
							<li>Click "Download ZIP" to get your converted stickers</li>
						</ol>

						<div className="my-8">
							<Link href="/">
								<Button size="lg" className="w-full sm:w-auto">
									Go to Converter
									<ArrowRight className="ml-2 h-5 w-5" />
								</Button>
							</Link>
						</div>

						<h2 className="text-2xl font-semibold mt-8 mb-4">
							Step 3: Import into Signal Desktop
						</h2>
						<p className="text-muted-foreground mb-4">
							Finally, import the converted stickers into Signal:
						</p>
						<ol className="list-decimal pl-6 text-muted-foreground space-y-2 mb-8">
							<li>Extract the downloaded ZIP file</li>
							<li>Open Signal Desktop on your computer</li>
							<li>Go to File → Create/Upload Sticker Pack</li>
							<li>Drag and drop the PNG files from the extracted folder</li>
							<li>Assign an emoji to each sticker (check the filenames for suggestions)</li>
							<li>Choose a cover image</li>
							<li>Enter a title and author name</li>
							<li>Click "Upload"</li>
						</ol>

						<p className="text-muted-foreground mb-8">
							Once uploaded, your sticker pack will automatically sync to your Signal mobile app
							and you'll receive a shareable link to send to friends.
						</p>

						<h2 className="text-2xl font-semibold mt-8 mb-4">Supported Sticker Types</h2>
						<p className="text-muted-foreground mb-4">
							StickerBridge supports all types of Telegram stickers:
						</p>
						<ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-8">
							<li>
								<strong>Static stickers</strong> (WebP format) → Converted to PNG
							</li>
							<li>
								<strong>Animated stickers</strong> (TGS/Lottie format) → Converted to APNG
							</li>
							<li>
								<strong>Video stickers</strong> (WebM format) → Converted to APNG
							</li>
						</ul>

						<h2 className="text-2xl font-semibold mt-8 mb-4">Tips for Best Results</h2>
						<ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-8">
							<li>
								Signal has a 300KB file size limit per sticker. Complex animations may be
								slightly compressed to fit.
							</li>
							<li>Signal supports up to 200 stickers per pack.</li>
							<li>
								The original emojis from Telegram are included in the filenames to help you
								assign them quickly.
							</li>
							<li>You cannot edit a sticker pack after uploading, so double-check before you upload.</li>
						</ul>

						<h2 className="text-2xl font-semibold mt-8 mb-4">Frequently Asked Questions</h2>

						<h3 className="text-lg font-semibold mt-6 mb-2">
							Why do I need Signal Desktop?
						</h3>
						<p className="text-muted-foreground mb-4">
							Signal only allows sticker pack creation through Signal Desktop. Once created, the
							pack syncs to your mobile app automatically.
						</p>

						<h3 className="text-lg font-semibold mt-6 mb-2">
							Is this service free?
						</h3>
						<p className="text-muted-foreground mb-4">
							Yes, StickerBridge is completely free with no limits or account required.
						</p>

						<h3 className="text-lg font-semibold mt-6 mb-2">
							Can I convert private sticker packs?
						</h3>
						<p className="text-muted-foreground mb-4">
							No, we can only convert public sticker packs that are accessible via URL.
						</p>

						<div className="mt-12 p-6 bg-muted rounded-lg">
							<h3 className="text-lg font-semibold mb-2">Ready to convert your stickers?</h3>
							<p className="text-muted-foreground mb-4">
								Start converting your favorite Telegram sticker packs to Signal now.
							</p>
							<Link href="/">
								<Button>
									Convert Stickers Now
									<ArrowRight className="ml-2 h-4 w-4" />
								</Button>
							</Link>
						</div>
					</div>
				</article>
			</main>

			{/* Footer */}
			<footer className="border-t mt-auto">
				<div className="container mx-auto px-4 py-8">
					<div className="flex flex-col md:flex-row items-center justify-between gap-4">
						<span className="font-semibold">StickerBridge</span>
						<nav className="flex items-center gap-6 text-sm text-muted-foreground">
							<Link href="/about" className="hover:text-foreground transition-colors">
								About
							</Link>
							<Link href="/faq" className="hover:text-foreground transition-colors">
								FAQ
							</Link>
						</nav>
						<div className="text-sm text-muted-foreground">Open Source</div>
					</div>
				</div>
			</footer>
		</div>
	)
}
