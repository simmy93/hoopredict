import React from 'react'
import { useForm } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface JoinLeagueDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    trigger?: React.ReactNode
    leagueType: 'league' | 'fantasy'
    title?: string
    description?: string
}

export default function JoinLeagueDialog({
    open,
    onOpenChange,
    trigger,
    leagueType,
    title = 'Join League',
    description = 'Enter the invite code to join a league',
}: JoinLeagueDialogProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        invite_code: ''
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const route = leagueType === 'league' ? '/leagues/join' : '/fantasy/leagues/join'
        post(route, {
            onSuccess: () => {
                onOpenChange(false)
                reset()
            },
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="invite_code">Invite Code</Label>
                        <Input
                            id="invite_code"
                            type="text"
                            value={data.invite_code}
                            onChange={(e) => setData('invite_code', e.target.value)}
                            placeholder="Enter invite code"
                            maxLength={12}
                            autoFocus
                        />
                        {errors.invite_code && (
                            <p className="text-sm text-red-600 mt-1">{errors.invite_code}</p>
                        )}
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
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
    )
}
