import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Head, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {championship?.name || 'Games'}
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
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
                                    className="hover:shadow-lg transition-shadow duration-200"
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardDescription>
                                                Round {game.round}
                                            </CardDescription>
                                            {getStatusBadge(game.status)}
                                        </div>
                                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                            {formatGameDate(game.scheduled_at)}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Home Team */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                {game.home_team.logo_url ? (
                                                    <img
                                                        src={game.home_team.logo_url}
                                                        alt={game.home_team.name}
                                                        className="w-10 h-10 object-contain flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
                                                )}
                                                <span className="font-semibold text-gray-900 dark:text-white truncate">
                                                    {game.home_team.name}
                                                </span>
                                            </div>
                                            {game.status === 'finished' && game.home_score !== null && (
                                                <span className="text-2xl font-bold text-gray-900 dark:text-white ml-2">
                                                    {game.home_score}
                                                </span>
                                            )}
                                        </div>

                                        {/* Away Team */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                {game.away_team.logo_url ? (
                                                    <img
                                                        src={game.away_team.logo_url}
                                                        alt={game.away_team.name}
                                                        className="w-10 h-10 object-contain flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
                                                )}
                                                <span className="font-semibold text-gray-900 dark:text-white truncate">
                                                    {game.away_team.name}
                                                </span>
                                            </div>
                                            {game.status === 'finished' && game.away_score !== null && (
                                                <span className="text-2xl font-bold text-gray-900 dark:text-white ml-2">
                                                    {game.away_score}
                                                </span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.last_page > 1 && (
                            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Showing {pagination.from} to {pagination.to} of {pagination.total} games
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(pagination.current_page - 1)}
                                        disabled={pagination.current_page === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Previous
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                                            let pageNum;
                                            if (pagination.last_page <= 5) {
                                                pageNum = i + 1;
                                            } else if (pagination.current_page <= 3) {
                                                pageNum = i + 1;
                                            } else if (pagination.current_page >= pagination.last_page - 2) {
                                                pageNum = pagination.last_page - 4 + i;
                                            } else {
                                                pageNum = pagination.current_page - 2 + i;
                                            }

                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={pagination.current_page === pageNum ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className="w-9 h-9 p-0"
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(pagination.current_page + 1)}
                                        disabled={pagination.current_page === pagination.last_page}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
