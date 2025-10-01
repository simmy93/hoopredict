import { Button } from '@/components/ui/button';
import { Link, router } from '@inertiajs/react';

interface League {
    id: number;
    name: string;
    description: string;
    is_private: boolean;
    is_active: boolean;
    max_members: number;
    members_count: number;
    predictions_count: number;
    owner: {
        id: number;
        name: string;
        email: string;
    };
}

interface PaginatedLeagues {
    data: League[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    leagues: PaginatedLeagues;
}

export default function Index({ leagues }: Props) {
    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this league?')) {
            router.delete(`/admin/leagues/${id}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Admin Panel - Leagues
                        </h1>
                        <div className="flex items-center space-x-4">
                            <Link href="/admin/users">
                                <Button variant="ghost">Users</Button>
                            </Link>
                            <Link href="/admin/league-members">
                                <Button variant="ghost">Members</Button>
                            </Link>
                            <Link href="/dashboard">
                                <Button variant="outline">Dashboard</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Leagues Management
                    </h2>
                    <Link href="/admin/leagues/create">
                        <Button>Create League</Button>
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Owner
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Members
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {leagues.data.map((league) => (
                                <tr key={league.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        {league.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {league.owner.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex gap-2">
                                            {league.is_active ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                    Inactive
                                                </span>
                                            )}
                                            {league.is_private && (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    Private
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {league.members_count} / {league.max_members}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <Link href={`/admin/leagues/${league.id}`}>
                                            <Button variant="ghost" size="sm">View</Button>
                                        </Link>
                                        <Link href={`/admin/leagues/${league.id}/edit`}>
                                            <Button variant="outline" size="sm">Edit</Button>
                                        </Link>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(league.id)}
                                        >
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {leagues.last_page > 1 && (
                    <div className="mt-4 flex justify-center space-x-2">
                        {Array.from({ length: leagues.last_page }, (_, i) => i + 1).map((page) => (
                            <Link key={page} href={`/admin/leagues?page=${page}`}>
                                <Button
                                    variant={page === leagues.current_page ? 'default' : 'outline'}
                                    size="sm"
                                >
                                    {page}
                                </Button>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}