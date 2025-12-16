import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"

export const metadata: Metadata = {
	title: "FAQ - Frequently Asked Questions",
	description:
		"Frequently asked questions about converting Telegram stickers to Signal format with StickerBridge. Learn how to import stickers, supported formats, and more.",
	alternates: {
		canonical: "https://stickerbridge.com/faq",
	},
}

const faqs = [
	{
		question: "How do I find a Telegram sticker pack URL?",
		answer:
			"In Telegram, tap on any sticker, then tap the pack name at the top. You'll see a 'Share' button that gives you the link, or you can copy it from the address bar if using Telegram Web. The URL looks like: https://t.me/addstickers/PackName",
	},
	{
		question: "How do I import the stickers into Signal?",
		answer:
			"Download and extract the ZIP file. Open Signal Desktop, go to File > Create/Upload Sticker Pack, drag in the PNG files, assign emojis to each sticker, and click Upload. The pack will sync to your mobile Signal app automatically.",
	},
	{
		question: "Why do I need Signal Desktop?",
		answer:
			"Signal only allows sticker pack creation through Signal Desktop (Windows, Mac, or Linux). Once created, the pack syncs to your mobile app and can be shared with anyone.",
	},
	{
		question: "Why are some stickers lower quality?",
		answer:
			"Signal has a 300KB file size limit per sticker. For complex animated stickers, we may need to reduce the frame rate or dimensions to fit within this limit. We always try to maintain the best possible quality.",
	},
	{
		question: "Do you support animated stickers?",
		answer:
			"Yes! We support all three Telegram sticker types: static (WebP), animated (TGS/Lottie), and video (WebM). All are converted to Signal-compatible APNG or PNG format.",
	},
	{
		question: "Is this service free?",
		answer:
			"Yes, StickerBridge is completely free with no limits. We don't require accounts, subscriptions, or payments.",
	},
	{
		question: "Do you store my stickers?",
		answer:
			"No. Converted stickers are temporarily stored for download and automatically deleted after one hour. We don't keep any permanent copies.",
	},
	{
		question: "Can I convert private sticker packs?",
		answer:
			"We can only convert public sticker packs that are accessible via the Telegram Bot API. Private or restricted packs cannot be accessed.",
	},
	{
		question: "Why do I have to assign emojis manually in Signal?",
		answer:
			"Signal Desktop's import interface doesn't support automatic emoji assignment from files. We include the original Telegram emojis in the filenames to help you assign them quickly.",
	},
	{
		question: "Can I edit the stickers before importing?",
		answer:
			"Yes! The ZIP contains standard PNG/APNG files that you can edit with any image editor before importing to Signal.",
	},
	{
		question: "Is there a limit on pack size?",
		answer:
			"We convert entire Telegram packs regardless of size. However, Signal has a limit of 200 stickers per pack, so very large packs may need to be split.",
	},
	{
		question: "The conversion failed. What should I do?",
		answer:
			"Try again - temporary network issues can cause failures. If it keeps failing, the sticker pack may be private, deleted, or in an unsupported format. Feel free to report persistent issues on our GitHub.",
	},
]

// Generate JSON-LD for FAQ rich snippets
const faqJsonLd = {
	"@context": "https://schema.org",
	"@type": "FAQPage",
	mainEntity: faqs.map((faq) => ({
		"@type": "Question",
		name: faq.question,
		acceptedAnswer: {
			"@type": "Answer",
			text: faq.answer,
		},
	})),
}

export default function FAQPage() {
	return (
		<div className="min-h-screen bg-background flex flex-col">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
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
				<div className="max-w-2xl mx-auto">
					<Link
						href="/"
						className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
					>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to converter
					</Link>

					<h1 className="text-4xl font-bold mb-2">Frequently Asked Questions</h1>
					<p className="text-muted-foreground mb-8">
						Everything you need to know about converting Telegram stickers to Signal.
					</p>

					<div className="space-y-8">
						{faqs.map((faq, index) => (
							<div key={index} className="border-b pb-6 last:border-0">
								<h2 className="text-lg font-semibold mb-2">{faq.question}</h2>
								<p className="text-muted-foreground">{faq.answer}</p>
							</div>
						))}
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
