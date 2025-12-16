"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface ThemeToggleProps {
	size?: "default" | "sm" | "lg" | "icon"
}

export function ThemeToggle({ size = "icon" }: ThemeToggleProps) {
	const [mounted, setMounted] = useState(false)
	const { theme, setTheme } = useTheme()

	useEffect(() => {
		setMounted(true)
	}, [])

	if (!mounted) {
		return (
			<Button variant="outline" size={size} className={size !== "icon" ? "px-3" : ""} disabled>
				<Moon className="h-4 w-4" />
			</Button>
		)
	}

	return (
		<Button
			variant="outline"
			size={size}
			onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
			className={size !== "icon" ? "px-3" : ""}
		>
			{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
		</Button>
	)
}
