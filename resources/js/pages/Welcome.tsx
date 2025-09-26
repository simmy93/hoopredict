import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { login, register } from '@/routes';
import { Link } from '@inertiajs/react';
import { Lock, Moon, Zap } from 'lucide-react';

export default function Welcome() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="absolute inset-0 opacity-20">
                <div className="h-full w-full" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}></div>
            </div>

            <div className="relative">
                <div className="absolute top-6 right-6">
                    <ThemeToggle />
                </div>

                <div className="flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-primary-500 to-accent-500 text-white rounded-3xl shadow-2xl">
                            <Zap className="w-12 h-12" />
                        </div>

                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                            Welcome to{' '}
                            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                                HoopPredict
                            </span>
                        </h1>

                        <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
                            Your modern Laravel application with beautiful authentication, dark mode support, and a sleek design.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link href={login.url()}>
                                <Button size="lg" className="min-w-[140px]">
                                    Sign In
                                </Button>
                            </Link>
                            <Link href={register.url()}>
                                <Button variant="outline" size="lg" className="min-w-[140px]">
                                    Create Account
                                </Button>
                            </Link>
                        </div>

                        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 mx-auto">
                                    <Lock className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    Secure Authentication
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Built-in authentication with password reset, email verification, and secure session management.
                                </p>
                            </div>

                            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl flex items-center justify-center mb-6 mx-auto">
                                    <Moon className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    Dark Mode
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Beautiful dark and light themes with system preference detection and manual toggle.
                                </p>
                            </div>

                            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl flex items-center justify-center mb-6 mx-auto">
                                    <Zap className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    Modern Stack
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Laravel 12, React, Inertia.js, TypeScript, and Tailwind CSS v4 for the best developer experience.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}