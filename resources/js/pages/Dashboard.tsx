import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { home, logout } from '@/routes';
import { Link, router } from '@inertiajs/react';

interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
}

interface Team {
    id: number;
    name: string;
    logo_url: string;
}

interface Game {
    id: number;
    date: string | null;
    status: string;
    home_score: number | null;
    away_score: number | null;
    home_team: Team;
    away_team: Team;
}

interface DashboardProps {
    user: User;
    upcomingGames: Game[];
}

export default function Dashboard({ user, upcomingGames }: DashboardProps) {
    const handleLogout = () => {
        router.post(logout.url());
    };

    const formatGameDate = (dateString: string | null) => {
        if (!dateString) return 'Date TBD';

        // Parse as UTC and convert to local timezone
        const date = new Date(dateString + 'Z'); // Adding 'Z' ensures it's parsed as UTC
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const isToday = date.toDateString() === today.toDateString();
        const isTomorrow = date.toDateString() === tomorrow.toDateString();

        if (isToday) {
            return `Today, ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
        } else if (isTomorrow) {
            return `Tomorrow, ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="absolute inset-0 opacity-20">
                <div className="h-full w-full" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}></div>
            </div>

            <nav className="relative border-b border-white/20 bg-white/70 backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-800/70">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">
                        <div className="flex items-center">
                            <Link
                                href={home.url()}
                                className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                    />
                                </svg>
                            </Link>
                            <div className="ml-4">
                                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Dashboard
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <ThemeToggle />
                            <div className="flex items-center space-x-3">
                                <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {user.name}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {user.email}
                                    </div>
                                </div>
                                <Button
                                    onClick={handleLogout}
                                    variant="outline"
                                    size="sm"
                                >
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="relative">
                <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-green-400 to-green-600 text-white rounded-2xl shadow-xl">
                            <svg
                                className="w-10 h-10"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Welcome back, {user.name.split(' ')[0]}! 🎉
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                            You're successfully authenticated and ready to go.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
                            <Link href="/leagues" className="group">
                                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6 hover:shadow-2xl transition-all duration-200 group-hover:scale-105">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center mb-4">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        Prediction Leagues
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                        Predict game outcomes and compete with friends.
                                    </p>
                                </div>
                            </Link>

                            <Link href="/fantasy/leagues" className="group">
                                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6 hover:shadow-2xl transition-all duration-200 group-hover:scale-105">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl flex items-center justify-center mb-4">
                                        <span className="text-2xl">🏀</span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        Fantasy Basketball
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                        Build your dream team and compete in fantasy leagues.
                                    </p>
                                </div>
                            </Link>

                            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    Your Statistics
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    View your prediction accuracy and points across leagues.
                                </p>
                            </div>

                            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    EuroLeague Games
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    View upcoming games and current season standings.
                                </p>
                            </div>
                        </div>

                        {upcomingGames && upcomingGames.length > 0 && (
                            <div className="mt-12">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                    Upcoming Games
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {upcomingGames.map((game) => (
                                        <div
                                            key={game.id}
                                            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6 hover:shadow-2xl transition-all duration-200"
                                        >
                                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium">
                                                {formatGameDate(game.date)}
                                            </div>

                                            {/* Home Team */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-3">
                                                    {game.home_team.logo_url ? (
                                                        <img
                                                            src={game.home_team.logo_url}
                                                            alt={game.home_team.name}
                                                            className="w-10 h-10 object-contain"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                                                    )}
                                                    <span className="font-semibold text-gray-900 dark:text-white">
                                                        {game.home_team.name}
                                                    </span>
                                                </div>
                                                {game.status === 'finished' && game.home_score !== null && (
                                                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                                                        {game.home_score}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Away Team */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    {game.away_team.logo_url ? (
                                                        <img
                                                            src={game.away_team.logo_url}
                                                            alt={game.away_team.name}
                                                            className="w-10 h-10 object-contain"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                                                    )}
                                                    <span className="font-semibold text-gray-900 dark:text-white">
                                                        {game.away_team.name}
                                                    </span>
                                                </div>
                                                {game.status === 'finished' && game.away_score !== null && (
                                                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                                                        {game.away_score}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Status Badge */}
                                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                    game.status === 'finished'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                        : game.status === 'live'
                                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                }`}>
                                                    {game.status === 'finished' ? 'Final' : game.status === 'live' ? 'Live' : 'Scheduled'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}