import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Check if user has a theme preference
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light')
        setTheme(initialTheme)
        document.documentElement.classList.toggle('dark', initialTheme === 'dark')
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
        document.documentElement.classList.toggle('dark', newTheme === 'dark')
    }

    // Prevent hydration mismatch
    if (!mounted) {
        return (
            <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle theme"
                disabled
            >
                <Sun className="h-5 w-5 opacity-0" />
            </Button>
        )
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="relative overflow-hidden group hover:scale-110 active:scale-95 transition-transform duration-200"
        >
            {/* Icon container */}
            <div className="relative w-5 h-5">
                {/* Light mode icon */}
                <Sun
                    className={`absolute inset-0 h-5 w-5 text-amber-500 transition-all duration-300 group-hover:text-amber-600 ${
                        theme === 'light'
                            ? 'rotate-0 scale-100 opacity-100'
                            : 'rotate-90 scale-0 opacity-0'
                    }`}
                />
                {/* Dark mode icon */}
                <Moon
                    className={`absolute inset-0 h-5 w-5 text-blue-500 transition-all duration-300 group-hover:text-blue-400 ${
                        theme === 'dark'
                            ? 'rotate-0 scale-100 opacity-100'
                            : '-rotate-90 scale-0 opacity-0'
                    }`}
                />
            </div>
        </Button>
    )
}
