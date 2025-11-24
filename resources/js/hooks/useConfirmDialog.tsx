import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmDialogState {
    open: boolean
    title: string
    description: string
    variant?: 'default' | 'destructive'
    confirmLabel?: string
    cancelLabel?: string
    onConfirm: () => void
}

export function useConfirmDialog() {
    const [dialogState, setDialogState] = useState<ConfirmDialogState>({
        open: false,
        title: '',
        description: '',
        variant: 'default',
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel',
        onConfirm: () => {},
    })

    const showConfirm = (config: Omit<ConfirmDialogState, 'open'>) => {
        setDialogState({
            ...config,
            open: true,
            confirmLabel: config.confirmLabel || 'Confirm',
            cancelLabel: config.cancelLabel || 'Cancel',
            variant: config.variant || 'default',
        })
    }

    const hideConfirm = () => {
        setDialogState(prev => ({ ...prev, open: false }))
    }

    const handleConfirm = () => {
        dialogState.onConfirm()
        hideConfirm()
    }

    const ConfirmDialog = () => (
        <Dialog open={dialogState.open} onOpenChange={(open) => !open && hideConfirm()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{dialogState.title}</DialogTitle>
                    <DialogDescription>{dialogState.description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={hideConfirm}
                    >
                        {dialogState.cancelLabel}
                    </Button>
                    <Button
                        variant={dialogState.variant === 'destructive' ? 'destructive' : 'default'}
                        onClick={handleConfirm}
                    >
                        {dialogState.confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )

    return {
        showConfirm,
        hideConfirm,
        ConfirmDialog,
    }
}
