import React, { useState } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Trophy, Users, Plus, LogIn } from 'lucide-react'
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

export default function Index({ userLeagues = [] }: Props) {
    // Filter out any null/undefined leagues
    const validLeagues = userLeagues.filter(Boolean)
    const [open, setOpen] = useState(false)
    const { data, setData, post, processing, errors, reset } = useForm({
        invite_code: '',
    })

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault()
        post('/fantasy/leagues/join', {
            onSuccess: () => {
                reset()
                setOpen(false)
            },
        })
    }

    return (
        <AuthenticatedLayout>
            <Head title="Fantasy Leagues" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">Fantasy Basketball</h2>
                            <p className="text-muted-foreground mt-1">
                                Create your dream team and compete with friends
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Dialog open={open} onOpenChange={setOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="flex items-center gap-2">
                                        <LogIn className="h-4 w-4" />
                                        Join League
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Join Fantasy League</DialogTitle>
                                        <DialogDescription>
                                            Enter the invite code to join an existing league
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleJoin} className="space-y-4">
                                        <div>
                                            <Label htmlFor="invite_code">Invite Code</Label>
                                            <Input
                                                id="invite_code"
                                                value={data.invite_code}
                                                onChange={(e) => setData('invite_code', e.target.value.toUpperCase())}
                                                placeholder="ABC123"
                                                className="uppercase"
                                                maxLength={6}
                                            />
                                            {errors.invite_code && (
                                                <p className="text-sm text-red-600 mt-1">{errors.invite_code}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setOpen(false)}
                                                disabled={processing}
                                            >
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={processing}>
                                                {processing ? 'Joining...' : 'Join League'}
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                            <Link href="/fantasy/leagues/create">
                                <Button className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Create League
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
                                    <Button variant="outline" onClick={() => setOpen(true)}>Join League</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {validLeagues.map((league) => (
                                <Card key={league.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="flex items-center gap-2">
                                                    {league.name}
                                                </CardTitle>
                                                {league.description && (
                                                    <CardDescription className="mt-1">
                                                        {league.description}
                                                    </CardDescription>
                                                )}
                                            </div>
                                            <div className="flex gap-1">
                                                {league.is_private && (
                                                    <Badge variant="secondary">Private</Badge>
                                                )}
                                                <Badge variant="outline" className="text-xs">
                                                    {league.mode === 'budget' ? 'Budget' : 'Draft'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Users className="h-4 w-4" />
                                                {league.teams_count || 0}/{league.max_members} members
                                            </div>
                                            {league.championship && (
                                                <div className="text-xs text-muted-foreground">
                                                    {league.championship.name}
                                                </div>
                                            )}
                                        </div>
                                        <Link href={`/fantasy/leagues/${league.id}`}>
                                            <Button variant="outline" size="sm" className="w-full">
                                                View League
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    )
}
