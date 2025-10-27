import React, { useState } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Users, Crown, Settings, Plus, UserPlus, Trophy } from 'lucide-react'
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
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {userLeagues.map((league) => (
                                <Card
                                    key={league.id}
                                    className="group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1 hover:border-purple-400/50 bg-gradient-to-br from-white to-purple-50/30 dark:from-slate-900 dark:to-purple-950/20"
                                >
                                    {/* Animated gradient overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-blue-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:via-blue-500/5 group-hover:to-pink-500/5 transition-all duration-500" />

                                    <CardHeader className="relative">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="flex items-center gap-2 text-lg group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                    {league.name}
                                                    {league.owner.id === 1 && (
                                                        <Crown className="h-4 w-4 text-amber-500 animate-pulse" />
                                                    )}
                                                </CardTitle>
                                                {league.description && (
                                                    <CardDescription className="mt-1 line-clamp-2">
                                                        {league.description}
                                                    </CardDescription>
                                                )}
                                            </div>
                                            <div className="flex gap-1">
                                                {league.is_private && (
                                                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                                        Private
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="relative">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-lg">
                                                    <Users className="h-3.5 w-3.5" />
                                                </div>
                                                <span className="text-foreground">
                                                    {league.members_count}/{league.max_members} members
                                                </span>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className="font-mono font-bold border-2 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
                                            >
                                                {league.invite_code}
                                            </Badge>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link href={`/leagues/${league.id}`} className="flex-1">
                                                <Button
                                                    size="sm"
                                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all"
                                                >
                                                    View League
                                                </Button>
                                            </Link>
                                            {league.owner.id === 1 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="hover:bg-purple-100 dark:hover:bg-purple-950"
                                                >
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