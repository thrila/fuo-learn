import { useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import PageShell from '../components/common/PageShell'
import type { Quiz } from '../types'
import * as api from '../services/api'

export default function QuizzesPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading')
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  const fetchData = useCallback(async () => {
    if (!courseId) return
    setStatus('loading')
    setError('')
    try {
      const data = await api.getCourseQuizzes(courseId)
      setQuizzes(data)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quizzes')
      setStatus('error')
    }
  }, [courseId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handlePublish(quizId: string) {
    setActionError('')
    try {
      await api.publishQuiz(quizId)
      setQuizzes((prev) => prev.map((q) => q.id === quizId ? { ...q, isPublished: true } : q))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to publish quiz')
    }
  }

  async function handleUnpublish(quizId: string) {
    setActionError('')
    try {
      await api.unpublishQuiz(quizId)
      setQuizzes((prev) => prev.map((q) => q.id === quizId ? { ...q, isPublished: false } : q))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to unpublish quiz')
    }
  }

  async function handleDelete(quizId: string) {
    if (!window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) return
    setActionError('')
    try {
      await api.deleteQuiz(quizId)
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete quiz')
    }
  }

  const canManage = user?.role === 'admin' || user?.role === 'professor'

  return (
    <PageShell status={status} error={error} onRetry={fetchData}>
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary md:text-4xl">Quizzes</h1>
            <p className="mt-2 text-text-muted">Manage and review quizzes.</p>
          </div>
          {canManage && (
            <Link
              to={`/courses/${courseId}/quizzes/new`}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Create quiz
            </Link>
          )}
        </div>

        {actionError && (
          <div className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">{actionError}</div>
        )}

        {quizzes.length === 0 ? (
          <p className="mt-10 text-center text-text-muted">No quizzes yet.</p>
        ) : (
          <div className="mt-6 space-y-3">
            {quizzes.map((q) => (
              <div key={q.id} className="surface-card flex items-center justify-between p-5">
                <div>
                  <h3 className="font-semibold text-text-primary">{q.title}</h3>
                  {q.description && <p className="mt-1 text-sm text-text-muted">{q.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    q.isPublished ? 'bg-secondary-light text-secondary' : 'bg-bg-subtle text-text-muted'
                  }`}>
                    {q.isPublished ? 'Published' : 'Draft'}
                  </span>
                  {canManage && (
                    <>
                      {!q.isPublished && (
                        <Link
                          to={`/quizzes/${q.id}/review`}
                          className="rounded-lg bg-primary-light px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                        >
                          Review
                        </Link>
                      )}
                      {q.isPublished ? (
                        <button
                          onClick={() => handleUnpublish(q.id)}
                          className="rounded-lg border border-border-default bg-white px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-subtle"
                        >
                          Unpublish
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePublish(q.id)}
                          className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark"
                        >
                          Publish
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="rounded-lg bg-error/10 px-3 py-1.5 text-sm font-medium text-error transition-colors hover:bg-error/20"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  )
}
