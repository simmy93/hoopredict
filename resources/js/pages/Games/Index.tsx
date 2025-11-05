import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { Head, router } from '@inertiajs/react';
import { Calendar } from 'lucide-react';

interface Team {
    id: number;
    name: string;
    logo_url: string;
}

interface Game {
    id: number;
    scheduled_at: string | null;
    status: string;
    home_score: number | null;
    away_score: number | null;
    home_team: Team;
    away_team: Team;
    round: number;
}

interface Championship {
    id: number;
    name: string;
    slug: string;
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface Props {
    championship: Championship;
    games: Game[];
    pagination: Pagination | null;
}

export default function GamesIndex({ championship, games, pagination }: Props) {
    const formatGameDate = (dateString: string | null) => {
        if (!dateString) return 'Date TBD';

        const date = new Date(dateString);
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
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'finished':
                return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Final</Badge>;
            case 'live':
                return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 animate-pulse">Live</Badge>;
            default:
                return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Scheduled</Badge>;
        }
    };

    const handlePageChange = (page: number) => {
        router.get('/games', { page }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Games" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                            <h1 className="text-2xl font-bold">Games</h1>
                        </div>
                        <p className="text-muted-foreground mt-1">
                            View all scheduled, live, and finished games
                        </p>
                    </div>

                {!games || games.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p className="text-gray-500 dark:text-gray-400">
                                No games available
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {games.map((game) => (
                                <Card
                                    key={game.id}
                                    className="group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1 hover:border-blue-400/50 bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20"
                                >
                                    {/* Animated gradient overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-cyan-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:via-cyan-500/5 group-hover:to-indigo-500/5 transition-all duration-500" />

                                    <CardHeader className="pb-3 relative">
                                        <div className="flex items-center justify-between">
                                            <CardDescription className="flex items-center gap-2">
                                                <div className="px-2 py-1 rounded bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-sm">
                                                    <span className="text-xs font-bold">R{game.round}</span>
                                                </div>
                                            </CardDescription>
                                            {getStatusBadge(game.status)}
                                        </div>
                                        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {formatGameDate(game.scheduled_at)}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="relative">
                                        {/* Home Team */}
                                        <div className="flex items-center justify-between mb-3 p-2 rounded-lg bg-gradient-to-r from-transparent to-blue-50/50 dark:to-blue-950/30 group-hover:from-blue-50/50 dark:group-hover:from-blue-950/30 transition-all">
                                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                {game.home_team.logo_url ? (
                                                    <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                                        <img
                                                            src={game.home_team.logo_url}
                                                            alt={game.home_team.name}
                                                            className="w-8 h-8 object-contain flex-shrink-0"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-200 to-cyan-200 dark:from-blue-800 dark:to-cyan-800 rounded-lg flex-shrink-0" />
                                                )}
                                                <span className="font-semibold text-foreground truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {game.home_team.name}
                                                </span>
                                            </div>
                                            {game.status === 'finished' && game.home_score !== null && (
                                                <span className="text-2xl font-bold bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent ml-2">
                                                    {game.home_score}
                                                </span>
                                            )}
                                        </div>

                                        {/* VS Divider */}
                                        <div className="flex justify-center mb-3">
                                            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold shadow-lg">
                                                VS
                                            </span>
                                        </div>

                                        {/* Away Team */}
                                        <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-transparent to-blue-50/50 dark:to-blue-950/30 group-hover:from-blue-50/50 dark:group-hover:from-blue-950/30 transition-all">
                                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                {game.away_team.logo_url ? (
                                                    <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                                        <img
                                                            src={game.away_team.logo_url}
                                                            alt={game.away_team.name}
                                                            className="w-8 h-8 object-contain flex-shrink-0"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-200 to-cyan-200 dark:from-blue-800 dark:to-cyan-800 rounded-lg flex-shrink-0" />
                                                )}
                                                <span className="font-semibold text-foreground truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {game.away_team.name}
                                                </span>
                                            </div>
                                            {game.status === 'finished' && game.away_score !== null && (
                                                <span className="text-2xl font-bold bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent ml-2">
                                                    {game.away_score}
                                                </span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination && <Pagination pagination={pagination} onPageChange={handlePageChange} />}
                    </>
                )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
