import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useForm, Link } from '@inertiajs/react';

interface LeagueMember {
    id: number;
    league_id: number;
    user_id: number;
    role: string;
    joined_at: string;
    user: {
        id: number;
        name: string;
    };
    league: {
        id: number;
        name: string;
    };
}

interface League {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Props {
    member: LeagueMember;
    leagues: League[];
    users: User[];
}

export default function Edit({ member, leagues, users }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        league_id: member.league_id,
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at.split('T')[0], // Format for date input
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/league-members/${member.id}`);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                            <span className="hidden sm:inline">Admin Panel - </span>Edit Member
                        </h1>
                        <Button variant="outline" asChild>
                            <Link href="/admin/league-members">Back to Members</Link>
                        </Button>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Edit League Member
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Label htmlFor="league_id">League</Label>
                            <select
                                id="league_id"
                                value={data.league_id}
                                onChange={(e) => setData('league_id', parseInt(e.target.value))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                {leagues.map((league) => (
                                    <option key={league.id} value={league.id}>
                                        {league.name}
                                    </option>
                                ))}
                            </select>
                            {errors.league_id && (
                                <p className="text-red-500 text-sm mt-1">{errors.league_id}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="user_id">User</Label>
                            <select
                                id="user_id"
                                value={data.user_id}
                                onChange={(e) => setData('user_id', parseInt(e.target.value))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.email})
                                    </option>
                                ))}
                            </select>
                            {errors.user_id && (
                                <p className="text-red-500 text-sm mt-1">{errors.user_id}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="role">Role</Label>
                            <select
                                id="role"
                                value={data.role}
                                onChange={(e) => setData('role', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                                <option value="owner">Owner</option>
                            </select>
                            {errors.role && (
                                <p className="text-red-500 text-sm mt-1">{errors.role}</p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-4">
                            <Button type="button" variant="outline" asChild>
                                <Link href="/admin/league-members">Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Update Member
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}