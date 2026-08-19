import { ShieldX } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PageForbidden() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/10">
        <ShieldX className="h-7 w-7 text-warning" />
      </div>
      <h2 className="text-xl font-semibold text-text-primary">No permission</h2>
      <p className="max-w-sm text-sm text-text-muted">
        You don&apos;t have permission to view this page.
      </p>
      <Link
        to="/dashboard"
        className="mt-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
