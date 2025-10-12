import Flash from '@/components/Flash';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { home, logout } from '@/routes';
import { Link, router, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';

interface AuthenticatedLayoutProps {
    children: ReactNode;
}

interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
}

interface PageProps extends Record<string, any> {
    auth: {
        user: User;
    };
    flash: {
        success?: string;
        error?: string;
        info?: string;
    };
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
    const { auth, flash } = usePage<PageProps>().props;

    const handleLogout = () => {
        router.post(logout.url());
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
            <nav className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-sm dark:border-slate-800/60 dark:bg-slate-900/80">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center">
                            <Link
                                href={home.url()}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/40"
                            >
                                🏀
                            </Link>
                            <div className="ml-4">
                                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">HoopPredict</h1>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <nav className="flex space-x-1">
                                <Link
                                    href="/dashboard"
                                    className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/leagues"
                                    className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                                >
                                    Prediction Leagues
                                </Link>
                                <Link
                                    href="/fantasy/leagues"
                                    className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                                >
                                    Fantasy
                                </Link>
                            </nav>

                            <ThemeToggle />
                            <div className="flex items-center space-x-3">
                                <div className="text-right">
                                    <div className="text-sm font-medium text-slate-900 dark:text-white">{auth.user.name}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{auth.user.email}</div>
                                </div>
                                <Button onClick={handleLogout} variant="outline" size="sm">
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="relative">
                <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
                    <Flash flash={flash} />
                </div>
                {children}
            </main>

        </div>
    );
}
