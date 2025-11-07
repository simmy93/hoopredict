import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';

interface User {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
    email_verified_at: string | null;
    created_at: string;
    owned_leagues_count: number;
    league_members_count: number;
    predictions_count: number;
}

interface Props {
    user: User;
}

export default function Show({ user }: Props) {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                            <span className="hidden sm:inline">Admin Panel - </span>View User
                        </h1>
                        <div className="flex items-center space-x-4">
                            <Button variant="outline" asChild>
                                <Link href="/admin/users">Back to Users</Link>
                            </Button>
                            <Button asChild>
                                <Link href={`/admin/users/${user.id}/edit`}>Edit User</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">User Details</CardTitle>
                        <CardDescription>View detailed information about this user</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</h3>
                                <p className="mt-1 text-lg text-gray-900 dark:text-white">{user.name}</p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h3>
                                <p className="mt-1 text-lg text-gray-900 dark:text-white">{user.email}</p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</h3>
                                <p className="mt-1">
                                    {user.is_admin ? (
                                        <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                            Administrator
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                            User
                                        </span>
                                    )}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Verification</h3>
                                <p className="mt-1">
                                    {user.email_verified_at ? (
                                        <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                            Verified
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                            Not Verified
                                        </span>
                                    )}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</h3>
                                <p className="mt-1 text-lg text-gray-900 dark:text-white">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Statistics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Owned Leagues</p>
                                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{user.owned_leagues_count}</p>
                                </div>

                                <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">League Memberships</p>
                                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{user.league_members_count}</p>
                                </div>

                                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Predictions Made</p>
                                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{user.predictions_count}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
