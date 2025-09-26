import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('theme') as Theme;
            return stored || 'system';
        }
        return 'system';
    });

    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('theme') as Theme;
            const currentTheme = stored || 'system';

            if (currentTheme === 'system') {
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            return currentTheme as 'light' | 'dark';
        }
        return 'light';
    });

    const applyTheme = (themeToApply: Theme) => {
        const root = document.documentElement;

        if (themeToApply === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            setResolvedTheme(systemTheme);
            root.classList.remove('light', 'dark');
            root.classList.add(systemTheme);
        } else {
            setResolvedTheme(themeToApply as 'light' | 'dark');
            root.classList.remove('light', 'dark');
            root.classList.add(themeToApply);
        }
    };

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (theme === 'system') {
                const systemTheme = mediaQuery.matches ? 'dark' : 'light';
                setResolvedTheme(systemTheme);
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(systemTheme);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    const updateTheme = (newTheme: Theme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    return {
        theme,
        resolvedTheme,
        setTheme: updateTheme,
    };
}