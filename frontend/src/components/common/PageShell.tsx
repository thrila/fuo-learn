import type { ReactNode } from 'react'
import PageLoader from './PageLoader'
import PageError from './PageError'
import PageForbidden from './PageForbidden'

export type PageStatus = 'loading' | 'error' | 'success' | 'no_permission'

interface PageShellProps {
  status: PageStatus
  error?: string
  onRetry?: () => void
  children?: ReactNode
}

export default function PageShell({ status, error, onRetry, children }: PageShellProps) {
  if (status === 'loading') return <PageLoader />
  if (status === 'error') return <PageError message={error} onRetry={onRetry} />
  if (status === 'no_permission') return <PageForbidden />
  return <>{children}</>
}
