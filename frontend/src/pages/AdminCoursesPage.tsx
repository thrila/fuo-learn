import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/common/PageShell'
import type { Course } from '../types'
import * as api from '../services/api'

export default function AdminCoursesPage() {
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading')
  const [courses, setCourses] = useState<Course[]>([])
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  const fetchData = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      const data = await api.getCourses()
      setCourses(data)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return
    setActionError('')
    try {
      await api.deleteCourse(id)
      setCourses((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete course')
    }
  }

  return (
    <PageShell status={status} error={error} onRetry={fetchData}>
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary md:text-4xl">Manage Courses</h1>
            <p className="mt-2 text-text-muted">Administer platform courses.</p>
          </div>
          <Link
            to="/admin/courses/new"
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Create course
          </Link>
        </div>

        {actionError && (
          <div className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">{actionError}</div>
        )}

        {courses.length === 0 ? (
          <p className="mt-10 text-center text-text-muted">No courses found.</p>
        ) : (
          <div className="mt-6 space-y-3">
            {courses.map((c) => (
              <div key={c.id} className="surface-card flex items-center justify-between p-5">
                <Link to={`/courses/${c.id}`} className="flex-1">
                  <p className="text-sm font-medium text-primary">{c.code}</p>
                  <h3 className="font-semibold text-text-primary">{c.title}</h3>
                  <p className="text-sm text-text-muted">Prof. {c.professorName}</p>
                </Link>
                <div className="flex gap-2">
                  <Link
                    to={`/admin/courses/${c.id}/edit`}
                    className="rounded-lg border border-border-default bg-white px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-subtle"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="rounded-lg bg-error/10 px-3 py-1.5 text-sm font-medium text-error transition-colors hover:bg-error/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  )
}
