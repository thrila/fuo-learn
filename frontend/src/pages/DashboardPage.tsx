import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import PageShell from '../components/common/PageShell'

export default function DashboardPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <PageShell status="loading" />

  if (!user) return <PageShell status="no_permission" />

  return (
    <PageShell status="success">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <h1 className="text-3xl font-bold text-text-primary md:text-4xl">
          Welcome back, {user.firstName}
        </h1>
        <p className="mt-2 text-text-muted">
          {user.role === 'admin' && 'Manage users, courses, and platform settings.'}
          {user.role === 'professor' && 'Manage your courses, materials, and quizzes.'}
          {user.role === 'student' && 'Continue your learning journey.'}
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {user.role === 'student' && (
            <>
              <Link to="/courses" className="surface-card block p-6 transition-colors hover:bg-bg-subtle">
                <h3 className="font-semibold text-text-primary">Browse Courses</h3>
                <p className="mt-2 text-sm text-text-muted">Explore available courses to enroll in.</p>
              </Link>
              <Link to="/my-courses" className="surface-card block p-6 transition-colors hover:bg-bg-subtle">
                <h3 className="font-semibold text-text-primary">My Courses</h3>
                <p className="mt-2 text-sm text-text-muted">Continue where you left off.</p>
              </Link>
              <Link to="/progress" className="surface-card block p-6 transition-colors hover:bg-bg-subtle">
                <h3 className="font-semibold text-text-primary">Progress</h3>
                <p className="mt-2 text-sm text-text-muted">Track your learning achievements.</p>
              </Link>
            </>
          )}
          {user.role === 'professor' && (
            <>
              <Link to="/my-courses" className="surface-card block p-6 transition-colors hover:bg-bg-subtle">
                <h3 className="font-semibold text-text-primary">My Courses</h3>
                <p className="mt-2 text-sm text-text-muted">Manage courses you teach, enrollment requests, materials, and quizzes.</p>
              </Link>
              <Link to="/courses" className="surface-card block p-6 transition-colors hover:bg-bg-subtle">
                <h3 className="font-semibold text-text-primary">Browse Courses</h3>
                <p className="mt-2 text-sm text-text-muted">View all available courses on the platform.</p>
              </Link>
            </>
          )}
          {user.role === 'admin' && (
            <>
              <Link to="/admin/users" className="surface-card block p-6 transition-colors hover:bg-bg-subtle">
                <h3 className="font-semibold text-text-primary">Pending Users</h3>
                <p className="mt-2 text-sm text-text-muted">Approve or reject user registrations.</p>
              </Link>
              <Link to="/admin/users" className="surface-card block p-6 transition-colors hover:bg-bg-subtle">
                <h3 className="font-semibold text-text-primary">Users</h3>
                <p className="mt-2 text-sm text-text-muted">Manage platform users.</p>
              </Link>
              <Link to="/admin/courses" className="surface-card block p-6 transition-colors hover:bg-bg-subtle">
                <h3 className="font-semibold text-text-primary">Courses</h3>
                <p className="mt-2 text-sm text-text-muted">Manage platform courses.</p>
              </Link>
            </>
          )}
        </div>
      </div>
    </PageShell>
  )
}
