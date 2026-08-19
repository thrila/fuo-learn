import { useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageShell from '../components/common/PageShell'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import type { Quiz, Question } from '../types'
import * as api from '../services/api'

export default function QuizReviewPage() {
  const { id } = useParams<{ id: string }>()

  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading')
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    if (!id) return
    setStatus('loading')
    setError('')
    try {
      const [q, qs] = await Promise.all([
        api.getQuizById(id),
        api.getQuizQuestions(id),
      ])
      setQuiz(q)
      setQuestions(qs)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quiz')
      setStatus('error')
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handlePublish() {
    if (!id) return
    try {
      await api.publishQuiz(id)
      setQuiz((prev) => prev ? { ...prev, isPublished: true } : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish')
    }
  }

  async function handleUnpublish() {
    if (!id) return
    try {
      await api.unpublishQuiz(id)
      setQuiz((prev) => prev ? { ...prev, isPublished: false } : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unpublish')
    }
  }

  const generationStatus = quiz?.generationStatus

  return (
    <PageShell status={status} error={error} onRetry={fetchData}>
      {quiz && (
        <div className="mx-auto max-w-3xl px-4 py-12 md:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-text-primary">{quiz.title}</h1>
                {quiz.isPublished ? (
                  <span className="rounded-full bg-secondary-light px-3 py-1 text-xs font-semibold text-secondary">Published</span>
                ) : (
                  <span className="rounded-full bg-bg-subtle px-3 py-1 text-xs font-semibold text-text-muted">Draft</span>
                )}
              </div>
              <p className="mt-1 text-sm text-text-muted">
                {quiz.courseCode} &middot; {questions.length} questions
              </p>
            </div>
            <div className="flex gap-2">
              {quiz.isPublished ? (
                <button
                  onClick={handleUnpublish}
                  className="rounded-lg border border-border-default bg-white px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-subtle"
                >
                  Unpublish
                </button>
              ) : (
                <button
                  onClick={handlePublish}
                  disabled={questions.length === 0}
                  className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark disabled:opacity-50"
                >
                  Publish
                </button>
              )}
              <Link
                to={`/quizzes/${quiz.id}/edit`}
                className="rounded-lg border border-border-default bg-white px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-subtle"
              >
                Edit
              </Link>
              <Link
                to={`/courses/${quiz.courseId}`}
                className="rounded-lg border border-border-default bg-white px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-subtle"
              >
                Back
              </Link>
            </div>
          </div>

          {generationStatus && (
            <div className={`mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
              generationStatus === 'completed' ? 'bg-secondary-light text-secondary' :
              generationStatus === 'failed' ? 'bg-error/10 text-error' :
              generationStatus === 'generating' ? 'bg-primary-light text-primary' :
              'bg-bg-subtle text-text-muted'
            }`}>
              {generationStatus === 'completed' && <CheckCircle className="h-4 w-4" />}
              {generationStatus === 'failed' && <XCircle className="h-4 w-4" />}
              {generationStatus === 'generating' && <Loader2 className="h-4 w-4 animate-spin" />}
              <span className="font-medium capitalize">AI Generation: {generationStatus}</span>
            </div>
          )}

          {questions.length === 0 ? (
            <div className="mt-10 text-center">
              <p className="text-text-muted">No questions yet.</p>
              <Link
                to={`/quizzes/${quiz.id}/edit`}
                className="mt-4 inline-block rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                Add questions manually
              </Link>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-primary">Review Questions</h2>
                <span className="text-sm text-text-muted">{questions.length} total</span>
              </div>
              {questions.map((q, i) => (
                <div key={q.id} className="surface-card p-5">
                  <p className="font-medium text-text-primary">
                    <span className="mr-2 text-text-muted">{i + 1}.</span>
                    {q.question}
                  </p>
                  <div className="mt-3 space-y-2">
                    {q.options.map((opt, i) => (
                      <div
                        key={`${q.id}-${i}`}
                        className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm ${
                          opt === q.correctAnswer
                            ? 'border-secondary bg-secondary-light text-secondary font-medium'
                            : 'border-border-default bg-white text-text-secondary'
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${
                          opt === q.correctAnswer ? 'bg-secondary' : 'bg-border-default'
                        }`} />
                        {opt}
                        {opt === q.correctAnswer && (
                          <span className="ml-auto text-xs font-semibold text-secondary">Correct</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <p className="mt-3 rounded-lg bg-bg-subtle px-4 py-3 text-sm text-text-muted">
                      {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </PageShell>
  )
}
