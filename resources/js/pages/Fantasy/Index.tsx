import React from 'react'
import { Head, Link } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Users, Plus } from 'lucide-react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'

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

interface Props {
    userLeagues: FantasyLeague[]
}

export default function Index({ userLeagues }: Props) {
    return (
        <AuthenticatedLayout>
            <Head title="Fantasy Leagues" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <Trophy className="h-8 w-8" />
                                Fantasy Basketball
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Create your dream team and compete with friends
                            </p>
                        </div>
                        <Link href="/fantasy/leagues/create">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Create League
                            </Button>
                        </Link>
                    </div>

                    {userLeagues.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold mb-2">No Fantasy Leagues Yet</h3>
                                <p className="text-muted-foreground text-center mb-6 max-w-md">
                                    Start your fantasy basketball journey by creating a league or joining an existing one with an invite code.
                                </p>
                                <div className="flex gap-3">
                                    <Link href="/fantasy/leagues/create">
                                        <Button>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create League
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                            {userLeagues.map((league) => (
                                <Link key={league.id} href={`/fantasy/leagues/${league.id}`}>
                                    <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                                        <CardHeader>
                                            <CardTitle className="flex items-center justify-between">
                                                <span>{league.name}</span>
                                                <span className="text-xs font-normal px-2 py-1 bg-primary/10 text-primary rounded">
                                                    {league.mode === 'budget' ? 'Budget Mode' : 'Draft Mode'}
                                                </span>
                                            </CardTitle>
                                            <CardDescription>
                                                {league.championship.name} - {league.championship.season}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {league.description && (
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    {league.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <span>{league.teams_count || 0}/{league.max_members} Members</span>
                                                </div>
                                                {league.mode === 'budget' && (
                                                    <div>
                                                        <span className="font-medium">Budget:</span> ${(league.budget / 1000000).toFixed(0)}M
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="font-medium">Team Size:</span> {league.team_size}
                                                </div>
                                            </div>
                                            <div className="mt-3 text-sm text-muted-foreground">
                                                Owner: {league.owner.name}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    )
}
