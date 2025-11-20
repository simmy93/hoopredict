import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ShoppingCart, Users as UsersIcon } from 'lucide-react';
import MarketplaceTab from './components/MarketplaceTab';
import LineupTab from './components/LineupTab';
import FantasyLeagueChat from '@/components/FantasyLeagueChat';

interface User {
    id: number;
    name: string;
}

interface AuthUser {
    id: number;
    name: string;
    email: string;
}

interface Team {
    id: number;
    name: string;
    logo_url: string | null;
}

interface Player {
    id: number;
    name: string;
    position: string;
    jersey_number: number | null;
    price: number;
    photo_url: string | null;
    photo_headshot_url: string | null;
    country: string | null;
    is_active: boolean;
    team: Team;
}

interface FantasyTeamPlayer {
    id: number;
    fantasy_team_id: number;
    player_id: number;
    lineup_position: number | null;
    is_captain: boolean;
    purchase_price: number;
    points_earned: number;
    player: Player;
    round_fantasy_points?: number;
    round_team_points?: number | null;
    multiplier?: number;
}

interface Championship {
    id: number;
    name: string;
    season: string;
}

interface FantasyLeague {
    id: number;
    name: string;
    mode: 'budget' | 'draft';
    budget: number;
    team_size: number;
    championship: Championship;
}

interface FantasyTeam {
    id: number;
    team_name: string;
    budget_spent: number;
    budget_remaining: number;
    total_points: number;
    lineup_type: string | null;
    user: User;
}

interface PaginatedPlayers {
    data: Player[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface PositionCounts {
    Guard: number;
    Forward: number;
    Center: number;
}

interface Props {
    league: FantasyLeague;
    userTeam: FantasyTeam;
    // Marketplace data
    players: PaginatedPlayers;
    myPlayers: Player[];
    filters: {
        position?: string;
        team_id?: number;
        search?: string;
        sort?: string;
        direction?: string;
    };
    // Lineup data
    teamPlayers: FantasyTeamPlayer[];
    positionCounts: PositionCounts;
    startingLineupCounts: PositionCounts;
    hasValidTeamComposition: boolean;
    hasValidStartingLineup: boolean;
    selectedRound: number;
    allRounds: number[];
    isRoundFinished: boolean;
    roundTotalPoints: number | null;
    isRoundLocked: boolean;
    currentActiveRound: number | null;
}

export default function Show({
    league,
    userTeam,
    players,
    myPlayers,
    filters,
    teamPlayers,
    positionCounts,
    startingLineupCounts,
    hasValidTeamComposition,
    hasValidStartingLineup,
    selectedRound,
    allRounds,
    isRoundFinished,
    roundTotalPoints,
    isRoundLocked,
    currentActiveRound,
}: Props) {
    // Initialize tab from URL hash or default to marketplace
    const getInitialTab = () => {
        const hash = window.location.hash.replace('#', '');
        return hash === 'lineup' || hash === 'marketplace' ? hash : 'marketplace';
    };

    const [activeTab, setActiveTab] = useState(getInitialTab);

    // Update URL hash when tab changes
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        window.location.hash = value;
    };

    // Listen for hash changes (browser back/forward)
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            if (hash === 'lineup' || hash === 'marketplace') {
                setActiveTab(hash);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    return (
        <AuthenticatedLayout>
            <Head title={`${userTeam.team_name} - ${league.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link
                            href={`/fantasy/leagues/${league.id}`}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to League
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
                            <UsersIcon className="h-7 w-7 sm:h-8 sm:w-8" />
                            {userTeam.team_name}
                        </h1>
                        <p className="mt-1 text-muted-foreground">{league.name}</p>
                    </div>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="grid w-full max-w-md grid-cols-2">
                            <TabsTrigger value="marketplace" className="flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4" />
                                <span className="hidden sm:inline">Marketplace</span>
                                <span className="sm:hidden">Buy/Sell</span>
                            </TabsTrigger>
                            <TabsTrigger value="lineup" className="flex items-center gap-2">
                                <UsersIcon className="h-4 w-4" />
                                <span className="hidden sm:inline">Manage Lineup</span>
                                <span className="sm:hidden">Lineup</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="marketplace" className="mt-6">
                            <MarketplaceTab
                                league={league}
                                userTeam={userTeam}
                                players={players}
                                myPlayers={myPlayers}
                                filters={filters}
                                isRoundLocked={isRoundLocked}
                                currentActiveRound={currentActiveRound}
                            />
                        </TabsContent>

                        <TabsContent value="lineup" className="mt-6">
                            <LineupTab
                                league={league}
                                userTeam={userTeam}
                                teamPlayers={teamPlayers}
                                positionCounts={positionCounts}
                                startingLineupCounts={startingLineupCounts}
                                hasValidTeamComposition={hasValidTeamComposition}
                                hasValidStartingLineup={hasValidStartingLineup}
                                selectedRound={selectedRound}
                                allRounds={allRounds}
                                isRoundFinished={isRoundFinished}
                                roundTotalPoints={roundTotalPoints}
                                isRoundLocked={isRoundLocked}
                                currentActiveRound={currentActiveRound}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Floating Chat */}
            <FantasyLeagueChat
                leagueId={league.id}
                currentUserId={(usePage().props.auth as { user: AuthUser }).user.id}
            />
        </AuthenticatedLayout>
    );
}
