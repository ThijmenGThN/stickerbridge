import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import type { Metadata } from "next"
import "@/styles/globals.css"

export const metadata: Metadata = {
	metadataBase: new URL("https://stickerbridge.com"),
	title: {
		default: "StickerBridge - Convert Telegram Stickers to Signal Format Free",
		template: "%s | StickerBridge",
	},
	description:
		"Free online tool to convert Telegram sticker packs to Signal format instantly. Supports static WebP, animated TGS, and video WebM stickers. No account required, no limits.",
	keywords: [
		"telegram stickers",
		"signal stickers",
		"sticker converter",
		"telegram to signal",
		"convert stickers",
		"tgs to apng",
		"webm to apng",
		"sticker pack converter",
		"telegram sticker pack",
		"signal sticker pack",
		"convert telegram stickers to signal",
		"animated sticker converter",
		"lottie to apng",
		"free sticker converter",
	],
	authors: [{ name: "StickerBridge" }],
	creator: "StickerBridge",
	publisher: "StickerBridge",
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://stickerbridge.com",
		siteName: "StickerBridge",
		title: "StickerBridge - Convert Telegram Stickers to Signal Format Free",
		description:
			"Free online tool to convert Telegram sticker packs to Signal format instantly. Supports static, animated, and video stickers. No account required.",
	},
	twitter: {
		card: "summary_large_image",
		title: "StickerBridge - Convert Telegram Stickers to Signal",
		description:
			"Free online tool to convert Telegram sticker packs to Signal format. Supports static, animated, and video stickers.",
		creator: "@stickerbridge",
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	alternates: {
		canonical: "https://stickerbridge.com",
	},
	category: "technology",
}

// JSON-LD structured data
const jsonLd = {
	"@context": "https://schema.org",
	"@type": "WebApplication",
	name: "StickerBridge",
	description:
		"Free online tool to convert Telegram sticker packs to Signal format. Supports static, animated, and video stickers.",
	url: "https://stickerbridge.com",
	applicationCategory: "UtilitiesApplication",
	operatingSystem: "Any",
	offers: {
		"@type": "Offer",
		price: "0",
		priceCurrency: "USD",
	},
	featureList: [
		"Convert Telegram stickers to Signal format",
		"Support for static WebP stickers",
		"Support for animated TGS stickers",
		"Support for video WebM stickers",
		"No account required",
		"Free unlimited conversions",
	],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
				/>
			</head>
			<body>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					{children}
				</ThemeProvider>
				<Toaster />
			</body>
		</html>
	)
}
