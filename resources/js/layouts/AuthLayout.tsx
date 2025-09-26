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
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="absolute inset-0 opacity-20">
                <div className="h-full w-full" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}></div>
            </div>

            <div className="relative flex min-h-screen">
                <div className="flex w-full items-center justify-center px-4 sm:px-6 lg:px-8">
                    <div className="w-full max-w-md space-y-8">
                        <div className="absolute top-6 right-6">
                            <ThemeToggle />
                        </div>

                        <div className="text-center">
                            <Link
                                href={home.url()}
                                className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary-500 to-accent-500 text-white rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                            >
                                <Zap className="w-8 h-8" />
                            </Link>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                                {title}
                            </h2>
                            {subtitle && (
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    {subtitle}
                                </p>
                            )}
                        </div>

                        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-8">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}