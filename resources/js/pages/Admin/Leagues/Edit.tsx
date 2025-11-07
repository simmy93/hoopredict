import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, Link } from '@inertiajs/react';

interface League {
    id: number;
    name: string;
    description: string;
    is_private: boolean;
    is_active: boolean;
    owner_id: number;
    max_members: number;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Props {
    league: League;
    users: User[];
}

export default function Edit({ league, users }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: league.name,
        description: league.description || '',
        is_private: league.is_private,
        is_active: league.is_active,
        owner_id: league.owner_id,
        max_members: league.max_members,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/leagues/${league.id}`);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                            <span className="hidden sm:inline">Admin Panel - </span>Edit League
                        </h1>
                        <Button variant="outline" asChild>
                            <Link href="/admin/leagues">Back to Leagues</Link>
                        </Button>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Edit League
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Label htmlFor="name">League Name</Label>
                            <Input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="mt-1"
                            />
                            {errors.name && (
                                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="mt-1"
                                rows={4}
                            />
                            {errors.description && (
                                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="owner_id">Owner</Label>
                            <select
                                id="owner_id"
                                value={data.owner_id}
                                onChange={(e) => setData('owner_id', parseInt(e.target.value))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.email})
                                    </option>
                                ))}
                            </select>
                            {errors.owner_id && (
                                <p className="text-red-500 text-sm mt-1">{errors.owner_id}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="max_members">Max Members</Label>
                            <Input
                                id="max_members"
                                type="number"
                                min="2"
                                value={data.max_members}
                                onChange={(e) => setData('max_members', parseInt(e.target.value))}
                                className="mt-1"
                            />
                            {errors.max_members && (
                                <p className="text-red-500 text-sm mt-1">{errors.max_members}</p>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_private"
                                checked={data.is_private}
                                onCheckedChange={(checked) => setData('is_private', checked as boolean)}
                            />
                            <Label htmlFor="is_private">Private League</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_active"
                                checked={data.is_active}
                                onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                            />
                            <Label htmlFor="is_active">Active</Label>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <Button type="button" variant="outline" asChild>
                                <Link href="/admin/leagues">Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Update League
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}