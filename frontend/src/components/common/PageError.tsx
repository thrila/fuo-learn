import { AlertTriangle, RefreshCw } from 'lucide-react'

interface PageErrorProps {
  message?: string
  onRetry?: () => void
}

export default function PageError({ message = 'Something went wrong', onRetry }: PageErrorProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-error/10">
        <AlertTriangle className="h-7 w-7 text-error" />
      </div>
      <h2 className="text-xl font-semibold text-text-primary">Error</h2>
      <p className="max-w-sm text-sm text-text-muted">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  )
}
