import React, { useState } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Users, Crown, Settings, Plus, UserPlus } from 'lucide-react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'

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

interface Props {
    userLeagues: League[]
}

export default function Index({ userLeagues }: Props) {
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
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">My Leagues</h2>
                            <p className="text-muted-foreground mt-1">
                                Manage your prediction leagues and compete with friends
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="flex items-center gap-2">
                                        <UserPlus className="h-4 w-4" />
                                        Join League
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
                            <Link href="/leagues/create">
                                <Button className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Create League
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
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {userLeagues.map((league) => (
                                <Card key={league.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="flex items-center gap-2">
                                                    {league.name}
                                                    {league.owner.id === 1 && (
                                                        <Crown className="h-4 w-4 text-yellow-600" />
                                                    )}
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
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Users className="h-4 w-4" />
                                                {league.members_count}/{league.max_members} members
                                            </div>
                                            <Badge variant="outline">
                                                {league.invite_code}
                                            </Badge>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link href={`/leagues/${league.id}`} className="flex-1">
                                                <Button variant="outline" size="sm" className="w-full">
                                                    View League
                                                </Button>
                                            </Link>
                                            {league.owner.id === 1 && (
                                                <Button variant="ghost" size="sm">
                                                    <Settings className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
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