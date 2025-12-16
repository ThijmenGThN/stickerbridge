"use client"

import { Download, ArrowRight, Zap, Shield, Clock, CheckCircle2, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

type JobStatus = "idle" | "queued" | "downloading" | "converting" | "zipping" | "completed" | "failed"

interface JobState {
	status: JobStatus
	progress: { current: number; total: number; message?: string }
	result?: { download_url: string; pack_name: string; sticker_count: number }
	error?: string
}

export default function Page() {
	const [url, setUrl] = useState("")
	const [job, setJob] = useState<JobState>({
		status: "idle",
		progress: { current: 0, total: 0 },
	})
	const { resolvedTheme } = useTheme()
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	const isValidUrl = (input: string) => {
		const patterns = [
			/^https?:\/\/(t\.me|telegram\.me|telegram\.dog)\/addstickers\/[\w]+$/i,
			/^tg:\/\/addstickers\?set=[\w]+$/i,
		]
		return patterns.some((p) => p.test(input.trim()))
	}

	const extractPackName = (input: string) => {
		const match = input.match(/addstickers[?/](?:set=)?([\w]+)/i)
		return match ? match[1] : null
	}

	const handleConvert = async () => {
		if (!isValidUrl(url)) {
			toast.error("Invalid Telegram sticker pack URL")
			return
		}

		const packName = extractPackName(url)
		if (!packName) {
			toast.error("Could not extract pack name from URL")
			return
		}

		setJob({ status: "queued", progress: { current: 0, total: 0 } })

		try {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
			const response = await fetch(`${apiUrl}/api/convert`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ telegram_url: url }),
			})

			if (!response.ok) {
				throw new Error("Failed to start conversion")
			}

			const { job_id } = await response.json()

			// Connect to WebSocket for progress updates
			const wsUrl = apiUrl.replace(/^http/, "ws")
			const ws = new WebSocket(`${wsUrl}/ws/jobs/${job_id}`)

			ws.onmessage = (event) => {
				const data = JSON.parse(event.data)

				if (data.type === "progress") {
					setJob((prev) => ({
						...prev,
						status: data.status || prev.status,
						progress: {
							current: data.current,
							total: data.total,
							message: data.message,
						},
					}))
				} else if (data.type === "completed") {
					setJob({
						status: "completed",
						progress: { current: data.total || 0, total: data.total || 0 },
						result: {
							download_url: data.download_url,
							pack_name: data.pack_name,
							sticker_count: data.sticker_count,
						},
					})
					ws.close()
					toast.success("Conversion complete!")
				} else if (data.type === "failed") {
					setJob({
						status: "failed",
						progress: { current: 0, total: 0 },
						error: data.error,
					})
					ws.close()
					toast.error(data.error || "Conversion failed")
				}
			}

			ws.onerror = () => {
				setJob({
					status: "failed",
					progress: { current: 0, total: 0 },
					error: "Connection error",
				})
				toast.error("Connection error")
			}
		} catch (error) {
			setJob({
				status: "failed",
				progress: { current: 0, total: 0 },
				error: error instanceof Error ? error.message : "Unknown error",
			})
			toast.error("Failed to start conversion")
		}
	}

	const handleDownload = () => {
		if (job.result?.download_url) {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
			window.open(`${apiUrl}${job.result.download_url}`, "_blank")
		}
	}

	const handleReset = () => {
		setUrl("")
		setJob({ status: "idle", progress: { current: 0, total: 0 } })
	}

	const isProcessing = ["queued", "downloading", "converting", "zipping"].includes(job.status)
	const progressPercent =
		job.progress.total > 0 ? Math.round((job.progress.current / job.progress.total) * 100) : 0

	const statusMessages: Record<JobStatus, string> = {
		idle: "",
		queued: "Starting conversion...",
		downloading: "Downloading stickers from Telegram...",
		converting: "Converting to Signal format...",
		zipping: "Creating ZIP file...",
		completed: "Done!",
		failed: "Conversion failed",
	}

	return (
		<div className="min-h-screen bg-background flex flex-col">
			{/* Header */}
			<header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
				<div className="container mx-auto px-4 py-4 flex items-center justify-between">
					<div>
						<h1 className="text-xl font-bold">StickerBridge</h1>
						<a
							href="https://nantric.com"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
						>
							<span className="text-xs text-muted-foreground">powered by</span>
{mounted && (
								<Image
									src={resolvedTheme === "dark" ? "/assets/Text White Style 2.png" : "/assets/Text Black Style 2.png"}
									alt="Nantric"
									width={261}
									height={49}
									quality={100}
									className="h-4 w-auto"
								/>
							)}
						</a>
					</div>
					<ThemeToggle />
				</div>
			</header>

			{/* Hero Section */}
			<section className="border-b bg-gradient-to-b from-muted/50 to-background">
				<div className="container mx-auto px-4 py-16 text-center">
					<h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
						Bring Your Stickers to Signal
					</h2>
					<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
						Convert your favorite Telegram sticker packs to Signal format in seconds.
						No account needed, no limits, completely free.
					</p>
				</div>
			</section>

			{/* Main Converter Section */}
			<main className="container mx-auto px-4 py-12">
				<div className="max-w-4xl mx-auto space-y-12">

					{/* Converter Card */}
					<Card className="w-full max-w-lg mx-auto shadow-lg">
						<CardHeader className="text-center">
							<CardTitle className="text-2xl">Convert Sticker Pack</CardTitle>
							<CardDescription>
								Paste a Telegram sticker pack URL to get started
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* URL Input */}
							<div className="space-y-2">
								<Input
									type="url"
									placeholder="https://t.me/addstickers/PackName"
									value={url}
									onChange={(e) => setUrl(e.target.value)}
									disabled={isProcessing}
									className="h-12 text-base"
								/>
								{url && !isValidUrl(url) && (
									<p className="text-sm text-destructive">
										Please enter a valid Telegram sticker pack URL
									</p>
								)}
							</div>

							{/* Convert Button */}
							{job.status === "idle" && (
								<Button
									className="w-full h-12 text-base"
									size="lg"
									onClick={handleConvert}
									disabled={!url || !isValidUrl(url)}
								>
									Convert to Signal
									<ArrowRight className="ml-2 h-5 w-5" />
								</Button>
							)}

							{/* Progress */}
							{isProcessing && (
								<div className="space-y-3">
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground flex items-center gap-2">
											<Loader2 className="h-4 w-4 animate-spin" />
											{statusMessages[job.status]}
										</span>
										{job.progress.total > 0 && (
											<span className="font-medium">
												{job.progress.current}/{job.progress.total}
											</span>
										)}
									</div>
									<Progress value={progressPercent} className="h-2" />
									{job.progress.message && (
										<p className="text-xs text-muted-foreground text-center">
											{job.progress.message}
										</p>
									)}
									{job.status === "converting" && (
										<p className="text-xs text-muted-foreground text-center animate-pulse">
											Animated stickers may take longer to process
										</p>
									)}
								</div>
							)}

							{/* Success */}
							{job.status === "completed" && job.result && (
								<div className="space-y-4">
									<div className="rounded-lg bg-primary/10 border border-primary/20 p-4 text-center">
									<CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
										<p className="font-medium">{job.result.pack_name}</p>
										<p className="text-sm text-muted-foreground">
											{job.result.sticker_count} stickers ready
										</p>
									</div>
									<Button className="w-full h-12" size="lg" onClick={handleDownload}>
										<Download className="mr-2 h-5 w-5" />
										Download ZIP
									</Button>
									<Button variant="outline" className="w-full" onClick={handleReset}>
										Convert Another Pack
									</Button>
								</div>
							)}

							{/* Error */}
							{job.status === "failed" && (
								<div className="space-y-4">
									<div className="rounded-lg bg-destructive/10 p-4 text-center">
										<p className="text-sm text-destructive">{job.error || "Something went wrong"}</p>
									</div>
									<Button variant="outline" className="w-full" onClick={handleReset}>
										Try Again
									</Button>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Video Section */}
					<div className="max-w-lg mx-auto">
						<h3 className="text-lg font-semibold text-center mb-4">How to Import to Signal</h3>
						<img
							src="/HowTo.gif"
							alt="How to import stickers to Signal"
							className="w-full rounded-md border"
						/>
					</div>

					{/* How It Works */}
					<div className="py-8">
						<h3 className="text-2xl font-bold text-center mb-8">How It Works</h3>
						<div className="grid md:grid-cols-3 gap-6">
							<div className="text-center p-6">
								<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
									<span className="text-xl font-bold text-primary">1</span>
								</div>
								<h4 className="font-semibold mb-2">Paste URL</h4>
								<p className="text-sm text-muted-foreground">
									Copy any Telegram sticker pack link and paste it above
								</p>
							</div>
							<div className="text-center p-6">
								<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
									<span className="text-xl font-bold text-primary">2</span>
								</div>
								<h4 className="font-semibold mb-2">Convert</h4>
								<p className="text-sm text-muted-foreground">
									We download and convert all stickers to Signal-compatible format
								</p>
							</div>
							<div className="text-center p-6">
								<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
									<span className="text-xl font-bold text-primary">3</span>
								</div>
								<h4 className="font-semibold mb-2">Import</h4>
								<p className="text-sm text-muted-foreground">
									Download the ZIP and import it via Signal Desktop
								</p>
							</div>
						</div>
					</div>

					{/* Features */}
					<div className="py-8 border-t">
						<h3 className="text-2xl font-bold text-center mb-8">Why StickerBridge?</h3>
						<div className="grid md:grid-cols-3 gap-6">
							<Card className="border-0 shadow-none bg-muted/50">
								<CardContent className="pt-6">
									<Zap className="h-8 w-8 text-foreground mb-3" />
									<h4 className="font-semibold mb-2">Lightning Fast</h4>
									<p className="text-sm text-muted-foreground">
										Parallel conversion processes your entire pack in seconds, not minutes
									</p>
								</CardContent>
							</Card>
							<Card className="border-0 shadow-none bg-muted/50">
								<CardContent className="pt-6">
									<Shield className="h-8 w-8 text-foreground mb-3" />
									<h4 className="font-semibold mb-2">Privacy First</h4>
									<p className="text-sm text-muted-foreground">
										No accounts, no tracking. Files are automatically deleted after download
									</p>
								</CardContent>
							</Card>
							<Card className="border-0 shadow-none bg-muted/50">
								<CardContent className="pt-6">
									<Clock className="h-8 w-8 text-foreground mb-3" />
									<h4 className="font-semibold mb-2">Always Available</h4>
									<p className="text-sm text-muted-foreground">
										Convert stickers 24/7 with no rate limits or usage caps
									</p>
								</CardContent>
							</Card>
						</div>
					</div>

					{/* Supported Formats */}
					<div className="py-8 border-t text-center">
						<h3 className="text-lg font-semibold mb-4">Supported Sticker Types</h3>
						<div className="flex flex-wrap justify-center gap-3">
							<span className="px-4 py-2 bg-muted rounded-full text-sm">
								Static (WebP)
							</span>
							<span className="px-4 py-2 bg-muted rounded-full text-sm">
								Animated (TGS)
							</span>
							<span className="px-4 py-2 bg-muted rounded-full text-sm">
								Video (WebM)
							</span>
						</div>
					</div>

				</div>
			</main>

			{/* Footer */}
			<footer className="border-t mt-auto">
				<div className="container mx-auto px-4 py-8">
					<div className="flex flex-col md:flex-row items-center justify-between gap-4">
						<span className="font-semibold">StickerBridge</span>
						<nav className="flex items-center gap-6 text-sm text-muted-foreground">
							<Link href="/how-to-convert-telegram-stickers-to-signal" className="hover:text-foreground transition-colors">
								Guide
							</Link>
							<Link href="/faq" className="hover:text-foreground transition-colors">
								FAQ
							</Link>
							<Link href="/about" className="hover:text-foreground transition-colors">
								About
							</Link>
						</nav>
						<div className="text-sm text-muted-foreground">
							Open Source
						</div>
					</div>
				</div>
			</footer>
		</div>
	)
}
