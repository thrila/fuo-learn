import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import PageShell from '../components/common/PageShell'
import type { Enrollment } from '../types'
import * as api from '../services/api'

export default function MyCoursesPage() {
  const { user } = useAuth()
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading')
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      const data = await api.getMyEnrollments()
      setEnrollments(data)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses')
      setStatus('error')
    }
  }, [user?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const approved = enrollments.filter((e) => e.status === 'approved')
  const pending = enrollments.filter((e) => e.status === 'pending')
  const rejected = enrollments.filter((e) => e.status === 'rejected')

  return (
    <PageShell status={status} error={error} onRetry={fetchData}>
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <h1 className="text-3xl font-bold text-text-primary md:text-4xl">My Courses</h1>
        <p className="mt-2 text-text-muted">Courses you are enrolled in.</p>

        {enrollments.length === 0 ? (
          <div className="mt-10 text-center">
            <p className="text-text-muted">You are not enrolled in any courses yet.</p>
            <Link to="/courses" className="mt-4 inline-block rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark">
              Browse Courses
            </Link>
          </div>
        ) : (
          <>
            {approved.length > 0 && (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {approved.map((e) => (
                  <Link
                    key={e.id}
                    to={`/courses/${e.courseId}`}
                    className="surface-card block p-6 transition-transform duration-150 hover:-translate-y-0.5"
                  >
                    <p className="text-sm font-medium text-primary">{e.courseCode}</p>
                    <h3 className="mt-1 font-semibold text-text-primary">{e.courseTitle}</h3>
                    <span className="mt-3 inline-block rounded-full bg-secondary-light px-2.5 py-0.5 text-xs font-medium text-secondary">
                      Enrolled
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {pending.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-4 text-lg font-semibold text-text-primary">Pending Requests</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {pending.map((e) => (
                    <Link
                      key={e.id}
                      to={`/courses/${e.courseId}`}
                      className="surface-card block p-6 transition-transform duration-150 hover:-translate-y-0.5"
                    >
                      <p className="text-sm font-medium text-primary">{e.courseCode}</p>
                      <h3 className="mt-1 font-semibold text-text-primary">{e.courseTitle}</h3>
                      <span className="mt-3 inline-block rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium text-primary">
                        Pending approval
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {rejected.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-4 text-lg font-semibold text-text-primary">Rejected</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rejected.map((e) => (
                    <Link
                      key={e.id}
                      to={`/courses/${e.courseId}`}
                      className="surface-card block p-6 transition-transform duration-150 hover:-translate-y-0.5"
                    >
                      <p className="text-sm font-medium text-primary">{e.courseCode}</p>
                      <h3 className="mt-1 font-semibold text-text-primary">{e.courseTitle}</h3>
                      <span className="mt-3 inline-block rounded-full bg-error/10 px-2.5 py-0.5 text-xs font-medium text-error">
                        Rejected
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </PageShell>
  )
}
