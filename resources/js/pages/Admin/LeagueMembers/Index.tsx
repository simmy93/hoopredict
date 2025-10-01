import { Button } from '@/components/ui/button';
import { Link, router } from '@inertiajs/react';

interface LeagueMember {
    id: number;
    role: string;
    joined_at: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
    league: {
        id: number;
        name: string;
    };
}

interface PaginatedMembers {
    data: LeagueMember[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    members: PaginatedMembers;
}

export default function Index({ members }: Props) {
    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to remove this member?')) {
            router.delete(`/admin/league-members/${id}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Admin Panel - League Members
                        </h1>
                        <div className="flex items-center space-x-4">
                            <Link href="/admin/users">
                                <Button variant="ghost">Users</Button>
                            </Link>
                            <Link href="/admin/leagues">
                                <Button variant="ghost">Leagues</Button>
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
                        League Members Management
                    </h2>
                    <Link href="/admin/league-members/create">
                        <Button>Add Member</Button>
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    League
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Joined
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {members.data.map((member) => (
                                <tr key={member.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        {member.user.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {member.league.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            member.role === 'owner'
                                                ? 'bg-purple-100 text-purple-800'
                                                : member.role === 'admin'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(member.joined_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <Link href={`/admin/league-members/${member.id}/edit`}>
                                            <Button variant="outline" size="sm">Edit</Button>
                                        </Link>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(member.id)}
                                        >
                                            Remove
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {members.last_page > 1 && (
                    <div className="mt-4 flex justify-center space-x-2">
                        {Array.from({ length: members.last_page }, (_, i) => i + 1).map((page) => (
                            <Link key={page} href={`/admin/league-members?page=${page}`}>
                                <Button
                                    variant={page === members.current_page ? 'default' : 'outline'}
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