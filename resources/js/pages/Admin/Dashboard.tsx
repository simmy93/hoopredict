import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';

interface Stats {
    total_users: number;
    total_admins: number;
    total_leagues: number;
    active_leagues: number;
    total_members: number;
    total_players: number;
    active_players: number;
    total_fantasy_leagues: number;
}

interface Props {
    stats: Stats;
}

export default function Dashboard({ stats }: Props) {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Admin Panel
                        </h1>
                        <Button variant="outline" asChild>
                            <Link href="/dashboard">Back to Dashboard</Link>
                        </Button>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Admin Dashboard
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage users, leagues, players, and league members
                    </p>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <div className="ml-5">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total_users}</p>
                            </div>
                        </div>
                        <div className="mt-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {stats.total_admins} admin{stats.total_admins !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div className="ml-5">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Leagues</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total_leagues}</p>
                            </div>
                        </div>
                        <div className="mt-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {stats.active_leagues} active
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <div className="ml-5">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">League Members</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total_members}</p>
                            </div>
                        </div>
                        <div className="mt-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Total memberships
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-orange-500 rounded-md p-3">
                                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div className="ml-5">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">EuroLeague Players</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total_players}</p>
                            </div>
                        </div>
                        <div className="mt-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {stats.active_players} active
                            </p>
                        </div>
                    </div>
                </div>

                {/* Management Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Link href="/admin/users" className="group">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Users Management
                                </h3>
                                <svg className="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                Create, edit, and manage user accounts. Set admin permissions and view user statistics.
                            </p>
                            <div className="flex gap-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    CRUD Operations
                                </span>
                            </div>
                        </div>
                    </Link>

                    <Link href="/admin/leagues" className="group">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Leagues Management
                                </h3>
                                <svg className="h-6 w-6 text-gray-400 group-hover:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                Manage prediction leagues, set privacy settings, and control league activation status.
                            </p>
                            <div className="flex gap-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    CRUD Operations
                                </span>
                            </div>
                        </div>
                    </Link>

                    <Link href="/admin/league-members" className="group">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Members Management
                                </h3>
                                <svg className="h-6 w-6 text-gray-400 group-hover:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                Add or remove league members, change member roles, and manage league memberships.
                            </p>
                            <div className="flex gap-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                    CRUD Operations
                                </span>
                            </div>
                        </div>
                    </Link>

                    <Link href="/admin/players" className="group">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Players Management
                                </h3>
                                <svg className="h-6 w-6 text-gray-400 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                Manage EuroLeague player prices, update values based on performance, and control player data.
                            </p>
                            <div className="flex gap-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                    Price Management
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                    Bulk Actions
                                </span>
                            </div>
                        </div>
                    </Link>
                </div>
            </main>
        </div>
    );
}
