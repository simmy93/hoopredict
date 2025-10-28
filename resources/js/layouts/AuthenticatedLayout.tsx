import Flash from '@/components/Flash';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { home, logout } from '@/routes';
import { Link, router, usePage } from '@inertiajs/react';
import { BarChart3, Trophy, Users, HelpCircle, LogOut, Menu, Calendar } from 'lucide-react';
import { ReactNode, useState } from 'react';

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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        router.post(logout.url());
    };

    const currentPath = window.location.pathname;

    const navItems = [
        {
            href: '/statistics',
            label: 'Statistics',
            icon: BarChart3,
            color: 'blue',
            gradient: 'from-blue-500 to-cyan-500',
        },
        {
            href: '/games',
            label: 'Games',
            icon: Calendar,
            color: 'indigo',
            gradient: 'from-indigo-500 to-blue-500',
        },
        {
            href: '/leagues',
            label: 'Predictions',
            icon: Users,
            color: 'purple',
            gradient: 'from-purple-500 to-pink-500',
        },
        {
            href: '/fantasy/leagues',
            label: 'Fantasy',
            icon: Trophy,
            color: 'amber',
            gradient: 'from-amber-500 to-orange-500',
        },
        {
            href: '/how-it-works',
            label: 'How It Works',
            icon: HelpCircle,
            color: 'green',
            gradient: 'from-green-500 to-emerald-500',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
            <nav className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-sm dark:border-slate-800/60 dark:bg-slate-900/80">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center">
                            <Link
                                href={home.url()}
                                className="group inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-110 hover:shadow-xl hover:shadow-blue-500/50 hover:rotate-3"
                            >
                                <span className="text-xl group-hover:scale-110 transition-transform">🏀</span>
                            </Link>
                            <div className="ml-4">
                                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    HoopPredict
                                </h1>
                            </div>
                        </div>

                        {/* Navigation Items */}
                        <div className="flex items-center space-x-3">
                            {/* Desktop Navigation */}
                            <nav className="hidden md:flex space-x-1">
                                {navItems.map((item) => {
                                    const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
                                    const Icon = item.icon;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`
                                                group relative rounded-lg px-3 py-2 text-sm font-medium transition-all
                                                ${
                                                    isActive
                                                        ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg shadow-${item.color}-500/30`
                                                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                                }
                                            `}
                                        >
                                            <span className="flex items-center gap-2">
                                                <Icon className={`h-4 w-4 ${isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
                                                {item.label}
                                            </span>
                                            {!isActive && (
                                                <span className={`absolute inset-0 rounded-lg bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}></span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="hidden md:block h-6 w-px bg-slate-300 dark:bg-slate-700"></div>

                            <ThemeToggle />

                            {/* Desktop User Menu */}
                            <div className="hidden md:flex items-center space-x-3">
                                <div className="hidden sm:block text-right">
                                    <div className="text-sm font-medium text-slate-900 dark:text-white">{auth.user.name}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{auth.user.email}</div>
                                </div>
                                <Button
                                    onClick={handleLogout}
                                    variant="outline"
                                    size="sm"
                                    className="group hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:border-red-800 dark:hover:text-red-400"
                                >
                                    <LogOut className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                                    <span className="hidden sm:inline">Logout</span>
                                </Button>
                            </div>

                            {/* Mobile Hamburger Menu */}
                            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="sm" className="md:hidden">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                                    <SheetHeader>
                                        <SheetTitle>Menu</SheetTitle>
                                    </SheetHeader>
                                    <div className="mt-8 flex flex-col space-y-4">
                                        {/* User Info */}
                                        <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
                                            <div className="text-sm font-medium text-slate-900 dark:text-white">{auth.user.name}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">{auth.user.email}</div>
                                        </div>

                                        {/* Navigation Links */}
                                        {navItems.map((item) => {
                                            const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
                                            const Icon = item.icon;

                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    className={`
                                                        group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all
                                                        ${
                                                            isActive
                                                                ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg`
                                                                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                                        }
                                                    `}
                                                >
                                                    <Icon className={`h-5 w-5 ${isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
                                                    {item.label}
                                                </Link>
                                            );
                                        })}

                                        {/* Logout Button */}
                                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                            <Button
                                                onClick={handleLogout}
                                                variant="outline"
                                                className="w-full group hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:border-red-800 dark:hover:text-red-400"
                                            >
                                                <LogOut className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                                                Logout
                                            </Button>
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
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
