import React, { useState } from 'react'
import { Head, Link, useForm, usePage } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, UserPlus, Trophy, Users } from 'lucide-react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import LeagueCard from '@/components/LeagueCard'

interface AuthUser {
    id: number
    name: string
}

interface League {
    id: number
    name: string
    description: string | null
    is_private: boolean
    invite_code: string
    max_members: number
    is_active: boolean
    members_count: number
    owner: {
        id: number
        name: string
    }
    created_at: string
}

interface PublicLeague {
    id: number
    name: string
    description: string | null
    is_private: boolean
    max_members: number
    members_count: number
    owner: {
        id: number
        name: string
    }
}

interface Props {
    userLeagues: League[]
    publicLeagues: PublicLeague[]
}

export default function Index({ userLeagues, publicLeagues }: Props) {
    const { props } = usePage()
    const auth = props.auth as { user: AuthUser }
    const [joinDialogOpen, setJoinDialogOpen] = useState(false)
    const { data, setData, post, processing, errors, reset } = useForm({
        invite_code: ''
    })

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault()
        post('/leagues/join', {
            onSuccess: () => {
                setJoinDialogOpen(false)
                reset()
            },
            onError: () => {
                // Errors will be shown via the error display
            }
        })
    }

    return (
        <AuthenticatedLayout>
            <Head title="My Leagues" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <Trophy className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                                <h2 className="text-2xl font-bold text-foreground">My Leagues</h2>
                            </div>
                            <p className="text-muted-foreground mt-1">
                                Manage your prediction leagues and compete with friends
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="flex items-center justify-center gap-2 flex-1 sm:flex-initial">
                                        <UserPlus className="h-4 w-4" />
                                        <span className="hidden sm:inline">Join League</span>
                                        <span className="sm:hidden">Join</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Join League</DialogTitle>
                                        <DialogDescription>
                                            Enter the invite code to join a league
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleJoin} className="space-y-4">
                                        <div>
                                            <Label htmlFor="invite_code_header">Invite Code</Label>
                                            <Input
                                                id="invite_code_header"
                                                type="text"
                                                value={data.invite_code}
                                                onChange={(e) => setData('invite_code', e.target.value)}
                                                placeholder="Enter invite code"
                                                maxLength={12}
                                            />
                                            {errors.invite_code && (
                                                <p className="text-sm text-red-600 mt-1">{errors.invite_code}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setJoinDialogOpen(false)}
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
                            <Link href="/leagues/create" className="flex-1 sm:flex-initial">
                                <Button className="flex items-center justify-center gap-2 w-full">
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline">Create League</span>
                                    <span className="sm:hidden">Create</span>
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {userLeagues.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No leagues yet</h3>
                                <p className="text-muted-foreground text-center mb-4">
                                    Create your first league or join one with an invite code
                                </p>
                                <div className="flex gap-2">
                                    <Link href="/leagues/create">
                                        <Button>Create League</Button>
                                    </Link>
                                    <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline">Join League</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Join League</DialogTitle>
                                                <DialogDescription>
                                                    Enter the invite code to join a league
                                                </DialogDescription>
                                            </DialogHeader>
                                            <form onSubmit={handleJoin} className="space-y-4">
                                                <div>
                                                    <Label htmlFor="invite_code">Invite Code</Label>
                                                    <Input
                                                        id="invite_code"
                                                        type="text"
                                                        value={data.invite_code}
                                                        onChange={(e) => setData('invite_code', e.target.value)}
                                                        placeholder="Enter invite code"
                                                        maxLength={12}
                                                    />
                                                    {errors.invite_code && (
                                                        <p className="text-sm text-red-600 mt-1">{errors.invite_code}</p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 justify-end">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setJoinDialogOpen(false)}
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
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {userLeagues.map((league) => (
                                <LeagueCard
                                    key={league.id}
                                    id={league.id}
                                    name={league.name}
                                    description={league.description}
                                    isPrivate={league.is_private}
                                    memberCount={league.members_count}
                                    maxMembers={league.max_members}
                                    href={`/leagues/${league.id}`}
                                    colorTheme="purple"
                                    isOwner={league.owner.id === auth.user.id}
                                />
                            ))}
                        </div>
                    )}

                    {/* Public Leagues Section */}
                    {publicLeagues.length > 0 && (
                        <div className="mt-12">
                            <div className="flex items-center gap-2 mb-6">
                                <Users className="h-6 w-6 text-emerald-500" />
                                <h2 className="text-2xl font-bold text-foreground">Public Leagues</h2>
                            </div>
                            <p className="text-muted-foreground mb-6">
                                Browse and join public prediction leagues
                            </p>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {publicLeagues.map((league) => (
                                    <LeagueCard
                                        key={league.id}
                                        id={league.id}
                                        name={league.name}
                                        description={league.description}
                                        isPrivate={false}
                                        memberCount={league.members_count}
                                        maxMembers={league.max_members}
                                        href={`/leagues/${league.id}/join-public`}
                                        colorTheme="emerald"
                                        isMember={false}
                                        ownerName={league.owner.name}
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