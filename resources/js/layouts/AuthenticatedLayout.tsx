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

interface PageProps {
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
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="absolute inset-0 opacity-20">
                <div
                    className="h-full w-full"
                    style={{
                        backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                    }}
                ></div>
            </div>

            <nav className="relative border-b border-white/20 bg-white/70 backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-800/70">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center">
                            <Link
                                href={home.url()}
                                className="inline-flex h-10 w-10 transform items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
                            >
                                🏀
                            </Link>
                            <div className="ml-4">
                                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">HoopPredict</h1>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <nav className="flex space-x-4">
                                <Link
                                    href="/dashboard"
                                    className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/leagues"
                                    className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                                >
                                    Prediction Leagues
                                </Link>
                                <Link
                                    href="/fantasy/leagues"
                                    className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                                >
                                    Fantasy
                                </Link>
                            </nav>

                            <ThemeToggle />
                            <div className="flex items-center space-x-3">
                                <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{auth.user.name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{auth.user.email}</div>
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
