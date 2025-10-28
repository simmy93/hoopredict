import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, CheckCircle, Clock, Copy, Crown, Link as LinkIcon, MapPin, Star, Trophy, Users, X, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';

interface User {
    id: number;
    name: string;
}

interface LeagueMember {
    id: number;
    user: User;
    role: string;
    joined_at: string;
}

interface LeaderboardEntry {
    id: number;
    user: User;
    total_points: number;
    total_predictions: number;
    correct_predictions: number;
    accuracy_percentage: number;
}

interface Team {
    id: number;
    name: string;
    city: string;
    country: string;
    logo_url: string | null;
}

interface Championship {
    id: number;
    name: string;
    season: string;
}

interface Game {
    id: number;
    scheduled_at: string;
    status: string;
    round: number;
    home_score: number | null;
    away_score: number | null;
    home_team: Team;
    away_team: Team;
    championship: Championship;
}

interface Prediction {
    id: number;
    game_id: number;
    home_score_prediction: number;
    away_score_prediction: number;
    points_earned: number | null;
    predicted_at: string;
}

interface League {
    id: number;
    name: string;
    description: string | null;
    is_private: boolean;
    invite_code: string;
    max_members: number;
    is_active: boolean;
    owner: User;
    members: LeagueMember[];
    leaderboards?: LeaderboardEntry[];
}

interface PaginatedGames {
    data: Game[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    league: League;
    userRole: string | null;
    members: LeagueMember[];
    leaderboard: LeaderboardEntry[];
    games: PaginatedGames;
    existingPredictions: Record<string, Prediction>;
    inviteUrl: string;
}

export default function Show({ league, userRole, members, leaderboard, games, existingPredictions, inviteUrl }: Props) {
    const { delete: destroy, processing, post, errors } = useForm();
    const [gameInputs, setGameInputs] = useState<Record<number, { home: string; away: string }>>({});
    const [processingGames, setProcessingGames] = useState<Set<number>>(new Set());
    const [feedbackMessages, setFeedbackMessages] = useState<Record<number, { type: 'success' | 'error'; message: string }>>({});
    const [copied, setCopied] = useState<'code' | 'url' | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
        variant?: 'default' | 'destructive';
    }>({
        open: false,
        title: '',
        description: '',
        onConfirm: () => {},
        variant: 'default'
    });

    const showFeedback = (gameId: number, type: 'success' | 'error', message: string) => {
        setFeedbackMessages((prev) => ({ ...prev, [gameId]: { type, message } }));
        // Auto-clear success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                setFeedbackMessages((prev) => {
                    const updated = { ...prev };
                    delete updated[gameId];
                    return updated;
                });
            }, 3000);
        }
    };

    const copyInviteCode = () => {
        navigator.clipboard.writeText(league.invite_code).then(() => {
            setCopied('code');
            setTimeout(() => setCopied(null), 2000);
        });
    };

    const copyInviteUrl = () => {
        navigator.clipboard.writeText(inviteUrl).then(() => {
            setCopied('url');
            setTimeout(() => setCopied(null), 2000);
        });
    };

    const leaveLeague = () => {
        setConfirmDialog({
            open: true,
            title: 'Leave League',
            description: `Are you sure you want to leave "${league.name}"? You can rejoin later if the league is still active.`,
            variant: 'destructive',
            onConfirm: () => {
                destroy(`/leagues/${league.id}/leave`);
            }
        });
    };

    const deleteLeague = () => {
        setConfirmDialog({
            open: true,
            title: 'Delete League',
            description: `Are you sure you want to delete "${league.name}"? This action cannot be undone and will remove all predictions and data.`,
            variant: 'destructive',
            onConfirm: () => {
                destroy(`/leagues/${league.id}`);
            }
        });
    };

    const kickMember = (userId: number, memberName: string) => {
        setConfirmDialog({
            open: true,
            title: 'Kick Member',
            description: `Are you sure you want to kick ${memberName} out of the league? This action cannot be undone.`,
            variant: 'destructive',
            onConfirm: () => {
                destroy(`/leagues/${league.id}/members/${userId}/kick`);
            }
        });
    };

    const formatDateTime = (dateTime: string) => {
        const date = new Date(dateTime);
        return {
            date: date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
            }),
            time: date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
            }),
        };
    };

    const canPredict = (game: Game) => {
        return game.status === 'scheduled' && new Date(game.scheduled_at) > new Date();
    };

    const getGameInputs = (gameId: number) => {
        if (gameInputs[gameId]) {
            return gameInputs[gameId];
        }

        const prediction = existingPredictions[gameId.toString()];
        return {
            home: prediction ? prediction.home_score_prediction.toString() : '',
            away: prediction ? prediction.away_score_prediction.toString() : '',
        };
    };

    const updateGameInput = (gameId: number, field: 'home' | 'away', value: string) => {
        setGameInputs((prev) => ({
            ...prev,
            [gameId]: {
                ...getGameInputs(gameId),
                [field]: value,
            },
        }));
    };

    const submitPrediction = (e: React.FormEvent, gameId: number) => {
        e.preventDefault();
        const inputs = getGameInputs(gameId);

        // Debug logging
        console.log('Form submission:', { gameId, inputs, leagueId: league.id });

        // Check if scores are equal (no ties allowed)
        if (inputs.home === inputs.away && inputs.home !== '' && inputs.away !== '') {
            alert('Basketball games cannot end in a tie. Please enter different scores.');
            return;
        }

        // Mark this game as processing
        setProcessingGames((prev) => new Set(prev).add(gameId));

        const data = {
            game_id: gameId.toString(),
            league_id: league.id.toString(),
            home_score_prediction: inputs.home,
            away_score_prediction: inputs.away,
        };

        console.log('Sending POST data:', data);

        router.post('/predictions', data, {
            onSuccess: () => {
                console.log('POST success');
                // Show success feedback
                const existingPrediction = existingPredictions[gameId.toString()];
                const message = existingPrediction ? 'Prediction updated successfully!' : 'Prediction saved successfully!';
                showFeedback(gameId, 'success', message);

                // Clear the temporary input state since we now have saved data
                setGameInputs((prev) => {
                    const newGameInputs = { ...prev };
                    delete newGameInputs[gameId];
                    return newGameInputs;
                });
                // Remove from processing
                setProcessingGames((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(gameId);
                    return newSet;
                });
                // Reload the page data to get updated predictions
                router.reload({ only: ['existingPredictions'] });
            },
            onError: (errors) => {
                console.log('POST error:', errors);
                // Show error feedback
                showFeedback(gameId, 'error', 'Failed to save prediction. Please try again.');

                // Remove from processing even on error
                setProcessingGames((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(gameId);
                    return newSet;
                });
            },
            preserveScroll: true,
        });
    };

    // All games are already sorted by scheduled_at from backend
    const allGames = games.data;

    return (
        <AuthenticatedLayout>
            <Head title={league.name} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href="/leagues" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Leagues
                        </Link>
                    </div>

                    {/* League Header */}
                    <Card className="mb-6">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        {league.name}
                                        {userRole === 'owner' && <Crown className="h-4 w-4 text-yellow-600" />}
                                    </CardTitle>
                                    {league.description && <CardDescription className="mt-1">{league.description}</CardDescription>}
                                </div>
                                <div className="flex gap-2">
                                    {league.is_private && <Badge variant="secondary">Private</Badge>}
                                    <Badge variant="outline" className="font-mono">
                                        {league.invite_code}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        {members.length}/{league.max_members} members
                                    </div>
                                    <div>Owner: {league.owner.name}</div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    {userRole === 'owner' && (
                                        <>
                                            <Button
                                                variant={copied === 'url' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={copyInviteUrl}
                                                title="Copy invite link"
                                                className="w-full sm:w-auto"
                                            >
                                                {copied === 'url' ? <CheckCircle className="mr-1 h-4 w-4" /> : <LinkIcon className="mr-1 h-4 w-4" />}
                                                {copied === 'url' ? 'Copied!' : 'Share Link'}
                                            </Button>
                                            <Button
                                                variant={copied === 'code' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={copyInviteCode}
                                                title="Copy invite code"
                                                className="w-full sm:w-auto"
                                            >
                                                {copied === 'code' ? <CheckCircle className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                                                {copied === 'code' ? 'Copied!' : 'Code'}
                                            </Button>
                                        </>
                                    )}
                                    {userRole && userRole !== 'owner' && (
                                        <Button variant="destructive" size="sm" onClick={leaveLeague} disabled={processing} className="w-full sm:w-auto">
                                            Leave
                                        </Button>
                                    )}
                                    {userRole === 'owner' && (
                                        <Button variant="destructive" size="sm" onClick={deleteLeague} disabled={processing} className="w-full sm:w-auto">
                                            Delete
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-6 lg:grid-cols-4">
                        {/* Main Content */}
                        <div className="lg:col-span-3">
                            <Tabs defaultValue="games" className="w-full">
                                <TabsList>
                                    <TabsTrigger value="games">Games & Predictions</TabsTrigger>
                                    <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                                </TabsList>

                                <TabsContent value="games" className="space-y-4">
                                    {allGames.length === 0 ? (
                                        <Card>
                                            <CardContent className="flex flex-col items-center justify-center py-12">
                                                <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                                                <h3 className="mb-2 text-lg font-semibold">No Games Available</h3>
                                                <p className="text-center text-muted-foreground">Check back later for new games</p>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <div className="space-y-4">
                                            {allGames.map((game) => {
                                                const { date, time } = formatDateTime(game.scheduled_at);
                                                const prediction = existingPredictions[game.id.toString()];
                                                const gameCanPredict = canPredict(game);
                                                const currentInputs = getGameInputs(game.id);
                                                const isProcessing = processingGames.has(game.id);
                                                const feedback = feedbackMessages[game.id];

                                                return (
                                                    <Card key={game.id} className="relative transition-shadow hover:shadow-md">
                                                        <CardHeader>
                                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                                {/* Top row: Championship, Round, Predicted badge */}
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <Badge variant="outline" className="text-xs">{game.championship.name}</Badge>
                                                                    <Badge variant="secondary" className="text-xs">Round {game.round}</Badge>
                                                                    {prediction && (
                                                                        <Badge variant="default" className="bg-green-600 text-xs">
                                                                            <Star className="mr-1 h-3 w-3" />
                                                                            Predicted
                                                                        </Badge>
                                                                    )}
                                                                </div>

                                                                {/* Bottom row: Date, Time, View All link */}
                                                                <div className="flex items-center justify-between sm:justify-end gap-3">
                                                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                                                        <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                                        <span>{date}</span>
                                                                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                                        <span>{time}</span>
                                                                    </div>
                                                                    <Link
                                                                        href={`/leagues/${league.id}/games/${game.id}/predictions`}
                                                                        className="text-primary hover:text-primary/80 text-xs sm:text-sm font-medium whitespace-nowrap"
                                                                        title="View all predictions for this game"
                                                                    >
                                                                        View All →
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent>
                                                            {/* Teams Display - Centered */}
                                                            <div className="mb-6 flex items-center justify-center space-x-8">
                                                                {/* Home Team */}
                                                                <div className="flex max-w-xs flex-1 flex-col items-center space-y-3">
                                                                    <div className="flex h-16 w-16 items-center justify-center">
                                                                        {game.home_team.logo_url ? (
                                                                            <img
                                                                                src={game.home_team.logo_url}
                                                                                alt={game.home_team.name}
                                                                                className="h-16 w-16 object-contain"
                                                                            />
                                                                        ) : (
                                                                            <div className="bg-primary text-primary-foreground flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold">
                                                                                {game.home_team.name.split(' ')[0].substring(0, 3).toUpperCase()}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <div className="text-lg font-bold">{game.home_team.name}</div>
                                                                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                                                                            <MapPin className="h-3 w-3" />
                                                                            {game.home_team.city}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="text-3xl font-bold text-muted-foreground">VS</div>

                                                                {/* Away Team */}
                                                                <div className="flex max-w-xs flex-1 flex-col items-center space-y-3">
                                                                    <div className="flex h-16 w-16 items-center justify-center">
                                                                        {game.away_team.logo_url ? (
                                                                            <img
                                                                                src={game.away_team.logo_url}
                                                                                alt={game.away_team.name}
                                                                                className="h-16 w-16 object-contain"
                                                                            />
                                                                        ) : (
                                                                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-lg font-bold text-secondary-foreground">
                                                                                {game.away_team.name.split(' ')[0].substring(0, 3).toUpperCase()}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <div className="text-lg font-bold">{game.away_team.name}</div>
                                                                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                                                                            <MapPin className="h-3 w-3" />
                                                                            {game.away_team.city}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Show actual scores for finished games */}
                                                            {game.status === 'finished' && game.home_score !== null ? (
                                                                <div className="space-y-4">
                                                                    <div className="flex items-center justify-center space-x-6 bg-muted/50 rounded-lg p-4">
                                                                        <div className="flex flex-col items-center space-y-2">
                                                                            <Label className="text-sm font-medium text-muted-foreground">Final Score</Label>
                                                                            <div className="w-20 text-center text-3xl font-bold text-foreground">
                                                                                {game.home_score}
                                                                            </div>
                                                                        </div>

                                                                        <div className="pt-6 text-2xl font-bold text-muted-foreground">-</div>

                                                                        <div className="flex flex-col items-center space-y-2">
                                                                            <Label className="text-sm font-medium text-muted-foreground">Final Score</Label>
                                                                            <div className="w-20 text-center text-3xl font-bold text-foreground">
                                                                                {game.away_score}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {prediction && (
                                                                        <div className="flex items-center justify-center space-x-6 border border-primary/20 rounded-lg p-4 bg-primary/5">
                                                                            <div className="flex flex-col items-center space-y-2">
                                                                                <Label className="text-sm font-medium text-muted-foreground">Your Prediction</Label>
                                                                                <div className="w-20 text-center text-2xl font-semibold text-primary">
                                                                                    {prediction.home_score_prediction}
                                                                                </div>
                                                                            </div>

                                                                            <div className="pt-6 text-xl font-bold text-muted-foreground">-</div>

                                                                            <div className="flex flex-col items-center space-y-2">
                                                                                <Label className="text-sm font-medium text-muted-foreground">Your Prediction</Label>
                                                                                <div className="w-20 text-center text-2xl font-semibold text-primary">
                                                                                    {prediction.away_score_prediction}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {prediction && prediction.points_earned !== null && prediction.points_earned !== undefined && (
                                                                        <div className="text-center">
                                                                            <Badge variant={prediction.points_earned > 0 ? "default" : "secondary"} className="text-lg py-1 px-4">
                                                                                {prediction.points_earned > 0 ? `+${prediction.points_earned}` : prediction.points_earned} points
                                                                            </Badge>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                /* Prediction Form for upcoming games */
                                                                <form onSubmit={(e) => submitPrediction(e, game.id)} className="space-y-4">
                                                                    <div className="flex items-center justify-center space-x-6">
                                                                        <div className="flex flex-col items-center space-y-2">
                                                                            <Label className="text-sm font-medium text-muted-foreground">Score</Label>
                                                                            <Input
                                                                                type="number"
                                                                                min="50"
                                                                                max="150"
                                                                                value={currentInputs.home}
                                                                                onChange={(e) => updateGameInput(game.id, 'home', e.target.value)}
                                                                                placeholder="80"
                                                                                className="w-20 text-center text-lg font-semibold"
                                                                                disabled={!gameCanPredict}
                                                                            />
                                                                        </div>

                                                                        <div className="pt-6 text-2xl font-bold text-muted-foreground">-</div>

                                                                        <div className="flex flex-col items-center space-y-2">
                                                                            <Label className="text-sm font-medium text-muted-foreground">Score</Label>
                                                                            <Input
                                                                                type="number"
                                                                                min="50"
                                                                                max="150"
                                                                                value={currentInputs.away}
                                                                                onChange={(e) => updateGameInput(game.id, 'away', e.target.value)}
                                                                                placeholder="80"
                                                                                className="w-20 text-center text-lg font-semibold"
                                                                                disabled={!gameCanPredict}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    {gameCanPredict ? (
                                                                        <div className="flex justify-center">
                                                                            <Button type="submit" disabled={isProcessing}>
                                                                                {isProcessing
                                                                                    ? 'Saving...'
                                                                                    : prediction
                                                                                      ? 'Update Prediction'
                                                                                      : 'Save Prediction'}
                                                                            </Button>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-center">
                                                                            <div className="text-sm text-muted-foreground">
                                                                                Predictions are closed for this game
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {feedback && (
                                                                        <div
                                                                            className={`mt-3 flex items-center justify-center gap-2 rounded-lg p-3 ${
                                                                                feedback.type === 'success'
                                                                                    ? 'border border-green-200 bg-green-50 text-green-700'
                                                                                    : 'border border-red-200 bg-red-50 text-red-700'
                                                                            }`}
                                                                        >
                                                                            {feedback.type === 'success' ? (
                                                                                <CheckCircle className="h-4 w-4" />
                                                                            ) : (
                                                                                <XCircle className="h-4 w-4" />
                                                                            )}
                                                                            <span className="text-sm font-medium">{feedback.message}</span>
                                                                        </div>
                                                                    )}
                                                                </form>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}

                                            {/* Pagination */}
                                            {games.last_page > 1 && (
                                                <div className="mt-6 flex justify-center items-center gap-2 flex-wrap">
                                                    {/* Previous Button */}
                                                    {games.current_page > 1 && (
                                                        <Link
                                                            href={`/leagues/${league.id}?page=${games.current_page - 1}`}
                                                            preserveScroll
                                                        >
                                                            <Button variant="outline" size="sm">
                                                                ← Previous
                                                            </Button>
                                                        </Link>
                                                    )}

                                                    {/* First Page */}
                                                    {games.current_page > 3 && (
                                                        <>
                                                            <Link href={`/leagues/${league.id}?page=1`} preserveScroll>
                                                                <Button variant="outline" size="sm">1</Button>
                                                            </Link>
                                                            {games.current_page > 4 && <span className="text-gray-400">...</span>}
                                                        </>
                                                    )}

                                                    {/* Page Numbers (show current page and 2 pages on each side) */}
                                                    {Array.from({ length: games.last_page }, (_, i) => i + 1)
                                                        .filter(page =>
                                                            page === games.current_page ||
                                                            (page >= games.current_page - 2 && page <= games.current_page + 2)
                                                        )
                                                        .map((page) => (
                                                            <Link
                                                                key={page}
                                                                href={`/leagues/${league.id}?page=${page}`}
                                                                preserveScroll
                                                            >
                                                                <Button
                                                                    variant={page === games.current_page ? 'default' : 'outline'}
                                                                    size="sm"
                                                                >
                                                                    {page}
                                                                </Button>
                                                            </Link>
                                                        ))}

                                                    {/* Last Page */}
                                                    {games.current_page < games.last_page - 2 && (
                                                        <>
                                                            {games.current_page < games.last_page - 3 && <span className="text-gray-400">...</span>}
                                                            <Link href={`/leagues/${league.id}?page=${games.last_page}`} preserveScroll>
                                                                <Button variant="outline" size="sm">{games.last_page}</Button>
                                                            </Link>
                                                        </>
                                                    )}

                                                    {/* Next Button */}
                                                    {games.current_page < games.last_page && (
                                                        <Link
                                                            href={`/leagues/${league.id}?page=${games.current_page + 1}`}
                                                            preserveScroll
                                                        >
                                                            <Button variant="outline" size="sm">
                                                                Next →
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="leaderboard">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Trophy className="h-5 w-5" />
                                                Leaderboard
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {leaderboard.length === 0 ? (
                                                <div className="py-8 text-center">
                                                    <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                                    <p className="text-muted-foreground">
                                                        No predictions made yet. Start making predictions to see the leaderboard!
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {leaderboard.map((entry, index) => (
                                                        <div key={entry.id} className="flex items-center justify-between rounded-lg bg-muted p-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
                                                                    {index + 1}
                                                                </div>
                                                                <div>
                                                                    <Link
                                                                        href={`/leagues/${league.id}/users/${entry.user.id}/predictions`}
                                                                        className="hover:text-primary cursor-pointer font-medium hover:underline"
                                                                    >
                                                                        {entry.user.name}
                                                                    </Link>
                                                                    <div className="text-sm text-muted-foreground">
                                                                        {entry.correct_predictions}/{entry.total_predictions} correct (
                                                                        {Number(entry.accuracy_percentage).toFixed(1)}%)
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-lg font-bold">{entry.total_points}</div>
                                                                <div className="text-sm text-muted-foreground">points</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Members ({members.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {members.map((member) => (
                                            <div key={member.id} className="flex items-center justify-between rounded-lg p-2 hover:bg-muted">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
                                                        {member.user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{member.user.name}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Joined {new Date(member.joined_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {member.role === 'owner' && <Crown className="h-4 w-4 text-yellow-600" />}

                                                    {/* Kick Out button: only visible if current user is owner AND member is not owner */}
                                                    {userRole === 'owner' && member.role !== 'owner' && (
                                                        <button
                                                            onClick={() => kickMember(member.user.id, member.user.name)}
                                                            className="rounded-full p-1 text-red-600 transition hover:bg-red-100"
                                                            title="Kick Out"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={confirmDialog.open}
                onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
                title={confirmDialog.title}
                description={confirmDialog.description}
                variant={confirmDialog.variant}
                onConfirm={confirmDialog.onConfirm}
                confirmText={confirmDialog.variant === 'destructive' ? 'Remove' : 'Confirm'}
            />
        </AuthenticatedLayout>
    );
}
