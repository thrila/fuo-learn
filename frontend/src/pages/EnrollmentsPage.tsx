import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PageShell from '../components/common/PageShell'
import type { Enrollment } from '../types'
import * as api from '../services/api'

export default function EnrollmentsPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading')
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  const fetchData = useCallback(async () => {
    if (!courseId) return
    setStatus('loading')
    setError('')
    try {
      const data = await api.getCourseEnrollments(courseId)
      setEnrollments(data)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load enrollments')
      setStatus('error')
    }
  }, [courseId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleStatus(id: string, newStatus: 'approved' | 'rejected') {
    setActionId(id)
    setActionError('')
    try {
      await api.updateEnrollmentStatus(id, newStatus)
      setEnrollments((prev) => prev.map((e) => e.id === id ? { ...e, status: newStatus } : e))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update enrollment')
    } finally {
      setActionId(null)
    }
  }

  const pending = enrollments.filter((e) => e.status === 'pending')
  const processed = enrollments.filter((e) => e.status !== 'pending')

  return (
    <PageShell status={status} error={error} onRetry={fetchData}>
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <h1 className="text-3xl font-bold text-text-primary md:text-4xl">Enrollment Requests</h1>
        <p className="mt-2 text-text-muted">Review and approve student enrollment requests.</p>

        {actionError && (
          <div className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">{actionError}</div>
        )}

        {pending.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Pending ({pending.length})</h2>
            <div className="space-y-3">
              {pending.map((e) => (
                <div key={e.id} className="surface-card flex items-center justify-between p-5">
                  <div>
                    <h3 className="font-semibold text-text-primary">{e.studentName}</h3>
                    <p className="text-sm text-text-muted">{e.studentEmail}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatus(e.id, 'approved')}
                      disabled={actionId === e.id}
                      className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatus(e.id, 'rejected')}
                      disabled={actionId === e.id}
                      className="rounded-lg bg-error/10 px-3 py-1.5 text-sm font-semibold text-error transition-colors hover:bg-error/20 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {processed.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Processed</h2>
            <div className="space-y-3">
              {processed.map((e) => (
                <div key={e.id} className="surface-card flex items-center justify-between p-5">
                  <div>
                    <h3 className="font-semibold text-text-primary">{e.studentName}</h3>
                    <p className="text-sm text-text-muted">{e.studentEmail}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                    e.status === 'approved' ? 'bg-secondary-light text-secondary' : 'bg-error/10 text-error'
                  }`}>
                    {e.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {enrollments.length === 0 && (
          <p className="mt-10 text-center text-text-muted">No enrollment requests yet.</p>
        )}
      </div>
    </PageShell>
  )
}
