import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/common/PageShell'
import type { QuizAttempt } from '../types'
import * as api from '../services/api'

export default function ProgressPage() {
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading')
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      const data = await api.getMyAttempts()
      setAttempts(data)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const byCourse = attempts.reduce<Record<string, { courseTitle: string; courseCode: string; attempts: QuizAttempt[] }>>((acc, a) => {
    const key = a.courseCode
    if (!acc[key]) acc[key] = { courseTitle: a.courseTitle, courseCode: a.courseCode, attempts: [] }
    acc[key].attempts.push(a)
    return acc
  }, {})

  return (
    <PageShell status={status} error={error} onRetry={fetchData}>
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <h1 className="text-3xl font-bold text-text-primary md:text-4xl">Progress</h1>
        <p className="mt-2 text-text-muted">Track your learning achievements.</p>

        {attempts.length === 0 ? (
          <div className="mt-10 text-center">
            <p className="text-text-muted">No quiz attempts yet.</p>
            <Link to="/courses" className="mt-4 inline-block rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark">
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {Object.values(byCourse).map((group) => {
              const scores = group.attempts
                .map((attempt) => attempt.score)
                .filter((score): score is number => score !== null && Number.isFinite(score))
              const avg = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null
              return (
                <div key={group.courseCode}>
                  <div className="mb-3 flex items-baseline gap-2">
                    <h2 className="text-lg font-semibold text-text-primary">{group.courseTitle}</h2>
                    <span className="text-sm text-text-muted">{group.courseCode}</span>
                    {avg !== null && (
                      <span className="ml-auto text-sm font-medium text-primary">Avg: {avg}%</span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {group.attempts.map((a) => (
                      <Link
                        key={a.id}
                        to={`/attempts/${a.id}`}
                        className="surface-card flex items-center justify-between p-4 transition-transform duration-150 hover:-translate-y-0.5"
                      >
                        <div>
                          <h3 className="font-medium text-text-primary">{a.quizTitle}</h3>
                          <p className="text-xs text-text-muted">
                            {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : 'In progress'}
                          </p>
                        </div>
                        {a.score !== null ? (
                          <span className={`text-lg font-bold ${
                            a.score >= 70 ? 'text-secondary' : a.score >= 50 ? 'text-warning' : 'text-error'
                          }`}>
                            {a.score}%
                          </span>
                        ) : (
                          <span className="text-sm text-text-disabled">In progress</span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PageShell>
  )
}
