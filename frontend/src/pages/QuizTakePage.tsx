import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageShell from '../components/common/PageShell'
import type { Quiz, Question } from '../types'
import * as api from '../services/api'

export default function QuizTakePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading')
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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

      const result = await api.startQuizAttempt(id)
      setAttemptId(result.attemptId)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quiz')
      setStatus('error')
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!attemptId || submitted) return

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [attemptId, submitted])

  function selectAnswer(questionId: string, answer: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  async function handleSubmit() {
    if (!attemptId) return
    setSubmitting(true)
    try {
      const answerList = questions.map((q) => ({
        questionId: q.id,
        selectedAnswer: answers[q.id] ?? '',
      }))
      await api.submitQuizAttempt(attemptId, answerList)
      setSubmitted(true)
      navigate(`/attempts/${attemptId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
      setSubmitting(false)
    }
  }

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id])

  return (
    <PageShell status={status} error={error} onRetry={fetchData}>
      {quiz && (
        <div className="mx-auto max-w-3xl px-4 py-12 md:px-8">
          <h1 className="text-3xl font-bold text-text-primary">{quiz.title}</h1>
          <p className="mt-2 text-text-muted">{questions.length} questions</p>

          <div className="mt-8 space-y-8">
            {questions.map((q, i) => (
              <div key={q.id} className="surface-card p-6">
                <p className="mb-4 font-medium text-text-primary">
                  <span className="mr-2 text-text-muted">{i + 1}.</span>
                  {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, i) => (
                    <label
                      key={`${q.id}-${i}`}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                        answers[q.id] === opt
                          ? 'border-primary bg-primary-light text-primary'
                          : 'border-border-default bg-white text-text-secondary hover:bg-bg-subtle'
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={() => selectAnswer(q.id, opt)}
                        className="sr-only"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit quiz'}
            </button>
          </div>
        </div>
      )}
    </PageShell>
  )
}
