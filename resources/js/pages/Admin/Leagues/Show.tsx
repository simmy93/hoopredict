import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';

interface League {
    id: number;
    name: string;
    description: string;
    is_private: boolean;
    is_active: boolean;
    max_members: number;
    invite_code: string;
    created_at: string;
    owner: {
        id: number;
        name: string;
        email: string;
    };
    members_count: number;
    predictions_count: number;
}

interface Props {
    league: League;
}

export default function Show({ league }: Props) {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                            <span className="hidden sm:inline">Admin Panel - </span>View League
                        </h1>
                        <div className="flex items-center space-x-4">
                            <Button variant="outline" asChild>
                                <Link href="/admin/leagues">Back to Leagues</Link>
                            </Button>
                            <Button asChild>
                                <Link href={`/admin/leagues/${league.id}/edit`}>Edit League</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">{league.name}</CardTitle>
                        <CardDescription>View detailed information about this league</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                                <p className="mt-1 text-lg text-gray-900 dark:text-white">
                                    {league.description || 'No description provided'}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Owner</h3>
                                <p className="mt-1 text-lg text-gray-900 dark:text-white">{league.owner.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{league.owner.email}</p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</h3>
                                <p className="mt-1 text-lg text-gray-900 dark:text-white">
                                    {new Date(league.created_at).toLocaleDateString()}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
                                <div className="mt-1 flex gap-2">
                                    {league.is_active ? (
                                        <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                            Active
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                            Inactive
                                        </span>
                                    )}
                                    {league.is_private && (
                                        <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                            Private
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Members</h3>
                                <p className="mt-1 text-lg text-gray-900 dark:text-white">
                                    {league.members_count} / {league.max_members}
                                </p>
                            </div>

                            {league.is_private && (
                                <div className="md:col-span-2">
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Invite Code</h3>
                                    <div className="mt-1 flex items-center gap-2">
                                        <code className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded text-lg font-mono text-gray-900 dark:text-white">
                                            {league.invite_code}
                                        </code>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => navigator.clipboard.writeText(league.invite_code)}
                                        >
                                            Copy
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Statistics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
                                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{league.members_count}</p>
                                </div>

                                <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Predictions</p>
                                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{league.predictions_count}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
