import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { Monitor, Moon, Sun } from 'lucide-react';

export function ThemeToggle({ className }: { className?: string }) {
    const { theme, setTheme, resolvedTheme } = useTheme();

    return (
        <button
            onClick={() => {
                if (theme === 'light') {
                    setTheme('dark');
                } else if (theme === 'dark') {
                    setTheme('system');
                } else {
                    setTheme('light');
                }
            }}
            className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-gray-300 bg-white/50 text-gray-700 backdrop-blur-sm transition-all hover:bg-white/80 hover:shadow-md dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:bg-gray-800/80',
                className
            )}
            title={`Theme: ${theme} (${resolvedTheme})`}
        >
            {theme === 'light' && <Sun className="h-5 w-5" />}
            {theme === 'dark' && <Moon className="h-5 w-5" />}
            {theme === 'system' && <Monitor className="h-5 w-5" />}
        </button>
    );
}