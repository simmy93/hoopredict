import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FlashProps {
  flash: {
    success?: string
    error?: string
    info?: string
  }
}

export default function Flash({ flash }: FlashProps) {
  const [visible, setVisible] = useState<{
    success: boolean
    error: boolean
    info: boolean
  }>({
    success: !!flash.success,
    error: !!flash.error,
    info: !!flash.info,
  })

  useEffect(() => {
    setVisible({
      success: !!flash.success,
      error: !!flash.error,
      info: !!flash.info,
    })

    // Auto-hide success and info messages after 5 seconds
    if (flash.success) {
      const timer = setTimeout(() => {
        setVisible(prev => ({ ...prev, success: false }))
      }, 5000)
      return () => clearTimeout(timer)
    }

    if (flash.info) {
      const timer = setTimeout(() => {
        setVisible(prev => ({ ...prev, info: false }))
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [flash])

  return (
    <div className="space-y-2">
      {/* Success Message */}
      {flash.success && visible.success && (
        <Alert variant="success" className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              {flash.success}
            </AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 text-green-700 hover:text-green-900"
            onClick={() => setVisible(prev => ({ ...prev, success: false }))}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {/* Error Message */}
      {flash.error && visible.error && (
        <Alert variant="destructive" className="flex items-center justify-between">
          <div className="flex items-center">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              {flash.error}
            </AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 text-red-700 hover:text-red-900"
            onClick={() => setVisible(prev => ({ ...prev, error: false }))}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {/* Info Message */}
      {flash.info && visible.info && (
        <Alert variant="info" className="flex items-center justify-between">
          <div className="flex items-center">
            <Info className="h-4 w-4" />
            <AlertDescription className="ml-2">
              {flash.info}
            </AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 text-blue-700 hover:text-blue-900"
            onClick={() => setVisible(prev => ({ ...prev, info: false }))}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}
    </div>
  )
}