import { router } from '@inertiajs/react'

interface League {
    id: number
    name: string
    owner_id: number
}

export function useLeagueActions(league: League, isOwner: boolean) {
    const leaveLeague = (onConfirm?: () => void) => {
        if (onConfirm) {
            onConfirm()
        }
        router.delete(`/leagues/${league.id}/leave`, {
            onSuccess: () => {
                // Redirects to leagues index
            },
        })
    }

    const deleteLeague = (onConfirm?: () => void) => {
        if (onConfirm) {
            onConfirm()
        }
        router.delete(`/leagues/${league.id}`, {
            onSuccess: () => {
                // Redirects to leagues index
            },
        })
    }

    const kickMember = (memberId: number, memberName: string, onConfirm?: () => void) => {
        if (onConfirm) {
            onConfirm()
        }
        router.delete(`/leagues/${league.id}/members/${memberId}/kick`, {
            preserveScroll: true,
            onSuccess: () => {
                // Page will refresh with success message
            },
        })
    }

    return {
        leaveLeague,
        deleteLeague,
        kickMember,
        canLeave: !isOwner,
        canDelete: isOwner,
        canKickMembers: isOwner,
    }
}
