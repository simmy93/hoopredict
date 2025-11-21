import React, { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Link2, Copy, Check, Trash2, Plus, Clock, Users, RefreshCw } from 'lucide-react'
import { Label } from '@/components/ui/label'

interface InvitationLink {
    id: number
    code: string
    url: string
    max_uses: number | null
    uses: number
    remaining_uses: number | null
    expires_at: string | null
    is_active: boolean
    status: 'active' | 'disabled' | 'expired' | 'exhausted'
    created_at: string
    creator: {
        id: number
        name: string
    }
}

interface Props {
    leagueId: number
    leagueType: 'league' | 'fantasy_league'
    isOwner: boolean
}

export default function InvitationLinkManager({ leagueId, leagueType, isOwner }: Props) {
    const [links, setLinks] = useState<InvitationLink[]>([])
    const [loading, setLoading] = useState(false)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [copiedId, setCopiedId] = useState<number | null>(null)
    const [maxUses, setMaxUses] = useState<string>('unlimited')
    const [expiresIn, setExpiresIn] = useState<string>('never')
    const [creating, setCreating] = useState(false)

    const fetchLinks = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/invitation-links?invitable_type=${leagueType}&invitable_id=${leagueId}`)
            const data = await response.json()
            setLinks(data.links)
        } catch (error) {
            console.error('Failed to fetch invitation links:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isOwner) {
            fetchLinks()
        }
    }, [isOwner, leagueId])

    const copyLink = (link: InvitationLink) => {
        navigator.clipboard.writeText(link.url)
        setCopiedId(link.id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const createLink = () => {
        setCreating(true)
        router.post('/invitation-links', {
            invitable_type: leagueType,
            invitable_id: leagueId,
            max_uses: maxUses === 'unlimited' ? null : parseInt(maxUses),
            expires_in: expiresIn,
        }, {
            onSuccess: () => {
                setCreateDialogOpen(false)
                setMaxUses('unlimited')
                setExpiresIn('never')
                fetchLinks()
            },
            onFinish: () => setCreating(false),
        })
    }

    const deactivateLink = (linkId: number) => {
        router.delete(`/invitation-links/${linkId}`, {
            onSuccess: () => fetchLinks(),
        })
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-500">Active</Badge>
            case 'expired':
                return <Badge variant="secondary">Expired</Badge>
            case 'exhausted':
                return <Badge variant="secondary">Used Up</Badge>
            case 'disabled':
                return <Badge variant="destructive">Disabled</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const formatExpiry = (expiresAt: string | null) => {
        if (!expiresAt) return 'Never'
        const date = new Date(expiresAt)
        const now = new Date()
        if (date < now) return 'Expired'

        const diffMs = date.getTime() - now.getTime()
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffDays = Math.floor(diffHours / 24)

        if (diffDays > 0) return `${diffDays}d left`
        if (diffHours > 0) return `${diffHours}h left`
        return 'Soon'
    }

    if (!isOwner) return null

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Link2 className="h-5 w-5" />
                            Invitation Links
                        </CardTitle>
                        <CardDescription>
                            Create and manage invite links with usage limits
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={fetchLinks} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Link
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create Invitation Link</DialogTitle>
                                    <DialogDescription>
                                        Configure limits for this invitation link
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Max Uses</Label>
                                        <Select value={maxUses} onValueChange={setMaxUses}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="unlimited">Unlimited</SelectItem>
                                                <SelectItem value="1">1 use</SelectItem>
                                                <SelectItem value="5">5 uses</SelectItem>
                                                <SelectItem value="10">10 uses</SelectItem>
                                                <SelectItem value="25">25 uses</SelectItem>
                                                <SelectItem value="50">50 uses</SelectItem>
                                                <SelectItem value="100">100 uses</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Expires In</Label>
                                        <Select value={expiresIn} onValueChange={setExpiresIn}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="never">Never</SelectItem>
                                                <SelectItem value="1h">1 hour</SelectItem>
                                                <SelectItem value="6h">6 hours</SelectItem>
                                                <SelectItem value="24h">24 hours</SelectItem>
                                                <SelectItem value="7d">7 days</SelectItem>
                                                <SelectItem value="30d">30 days</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={createLink} disabled={creating}>
                                        {creating ? 'Creating...' : 'Create Link'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading && links.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : links.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No invitation links yet. Create one to invite members.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {links.map((link) => (
                            <div
                                key={link.id}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border ${
                                    link.status !== 'active' ? 'opacity-60' : ''
                                }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {getStatusBadge(link.status)}
                                        <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[200px]">
                                            {link.code}
                                        </code>
                                    </div>
                                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {link.max_uses
                                                ? `${link.uses}/${link.max_uses} used`
                                                : `${link.uses} used`}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatExpiry(link.expires_at)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyLink(link)}
                                        disabled={link.status !== 'active'}
                                    >
                                        {copiedId === link.id ? (
                                            <>
                                                <Check className="h-4 w-4 mr-1" />
                                                Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-4 w-4 mr-1" />
                                                Copy
                                            </>
                                        )}
                                    </Button>
                                    {link.status === 'active' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deactivateLink(link.id)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
