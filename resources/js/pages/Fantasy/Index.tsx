import React, { useState } from 'react'
import { Head, Link } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, LogIn, Zap, Trophy } from 'lucide-react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import LeagueCard from '@/components/LeagueCard'
import JoinLeagueDialog from '@/components/JoinLeagueDialog'

interface Championship {
    id: number
    name: string
    season: string
}

interface FantasyLeague {
    id: number
    name: string
    description: string
    mode: 'budget' | 'draft'
    budget: number
    team_size: number
    is_private: boolean
    max_members: number
    owner: {
        id: number
        name: string
    }
    championship: Championship
    teams_count?: number
}

interface PublicLeague extends FantasyLeague {
    teams_count: number
}

interface Props {
    userLeagues: FantasyLeague[]
    publicLeagues: PublicLeague[]
}

export default function Index({ userLeagues = [], publicLeagues = [] }: Props) {
    // Filter out any null/undefined leagues
    const validLeagues = userLeagues.filter(Boolean)
    const [joinDialogOpen, setJoinDialogOpen] = useState(false)

    return (
        <AuthenticatedLayout>
            <Head title="Fantasy Leagues" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                                <h2 className="text-2xl font-bold text-foreground">Fantasy Basketball</h2>
                            </div>
                            <p className="text-muted-foreground mt-1">
                                Create your dream team and compete with friends
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <JoinLeagueDialog
                                open={joinDialogOpen}
                                onOpenChange={setJoinDialogOpen}
                                leagueType="fantasy"
                                title="Join Fantasy League"
                                description="Enter the invite code to join an existing league"
                                trigger={
                                    <Button variant="outline" className="flex items-center justify-center gap-2 flex-1 sm:flex-initial">
                                        <LogIn className="h-4 w-4" />
                                        <span className="hidden sm:inline">Join League</span>
                                        <span className="sm:hidden">Join</span>
                                    </Button>
                                }
                            />
                            <Link href="/fantasy/leagues/create" className="flex-1 sm:flex-initial">
                                <Button className="flex items-center justify-center gap-2 w-full">
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline">Create League</span>
                                    <span className="sm:hidden">Create</span>
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {validLeagues.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No fantasy leagues yet</h3>
                                <p className="text-muted-foreground text-center mb-4">
                                    Create your first league or join one with an invite code
                                </p>
                                <div className="flex gap-2">
                                    <Link href="/fantasy/leagues/create">
                                        <Button>Create League</Button>
                                    </Link>
                                    <JoinLeagueDialog
                                        open={joinDialogOpen}
                                        onOpenChange={setJoinDialogOpen}
                                        leagueType="fantasy"
                                        title="Join Fantasy League"
                                        description="Enter the invite code to join an existing league"
                                        trigger={<Button variant="outline">Join League</Button>}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {validLeagues.map((league) => (
                                <LeagueCard
                                    key={league.id}
                                    id={league.id}
                                    name={league.name}
                                    description={league.description}
                                    isPrivate={league.is_private}
                                    memberCount={league.teams_count || 0}
                                    maxMembers={league.max_members}
                                    href={`/fantasy/leagues/${league.id}`}
                                    colorTheme={league.mode === 'budget' ? 'emerald' : 'amber'}
                                    modeBadge={{
                                        icon: league.mode === 'budget' ? '💰' : '🎲',
                                        label: league.mode === 'budget' ? 'Budget' : 'Draft',
                                    }}
                                    seasonLabel={league.championship?.season}
                                />
                            ))}
                        </div>
                    )}

                    {/* Public Leagues Section */}
                    {publicLeagues.length > 0 && (
                        <div className="mt-12">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Zap className="h-5 w-5 text-amber-500" />
                                Browse Public Leagues
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                Join an existing public league and start competing!
                            </p>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {publicLeagues.map((league) => (
                                    <LeagueCard
                                        key={league.id}
                                        id={league.id}
                                        name={league.name}
                                        description={league.description}
                                        isPrivate={false}
                                        memberCount={league.teams_count}
                                        maxMembers={league.max_members}
                                        href={`/fantasy/leagues/${league.id}/join-public`}
                                        colorTheme={league.mode === 'budget' ? 'emerald' : 'amber'}
                                        isMember={false}
                                        modeBadge={{
                                            icon: league.mode === 'budget' ? '💰' : '🎲',
                                            label: league.mode === 'budget' ? 'Budget' : 'Draft',
                                        }}
                                        seasonLabel={league.championship?.season}
                                        ownerName={league.owner?.name}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    )
}
