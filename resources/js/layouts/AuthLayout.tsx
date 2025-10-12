import { ThemeToggle } from '@/components/ThemeToggle';
import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import { Zap } from 'lucide-react';
import { ReactNode } from 'react';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
            <div className="flex min-h-screen">
                <div className="flex w-full items-center justify-center px-4 sm:px-6 lg:px-8">
                    <div className="w-full max-w-md space-y-8">
                        <div className="absolute top-6 right-6">
                            <ThemeToggle />
                        </div>

                        <div className="text-center">
                            <Link
                                href={home.url()}
                                className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/40 transition-all"
                            >
                                <Zap className="w-8 h-8" />
                            </Link>
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {title}
                            </h2>
                            {subtitle && (
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                    {subtitle}
                                </p>
                            )}
                        </div>

                        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-2xl p-8">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}