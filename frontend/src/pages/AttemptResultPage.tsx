import { useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageShell from '../components/common/PageShell'
import * as api from '../services/api'

interface AnswerDetail {
  questionId: string
  question: string
  options: string[]
  selectedAnswer: string
  correctAnswer: string
  explanation: string | null
  isCorrect: boolean
}

interface AttemptView {
  score: number | null
  quizTitle: string
  courseTitle: string
  courseCode: string
  totalQuestions: number
  correctAnswers: number
  answers: AnswerDetail[]
}

export default function AttemptResultPage() {
  const { id } = useParams<{ id: string }>()

  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading')
  const [attempt, setAttempt] = useState<AttemptView | null>(null)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    if (!id) return
    setStatus('loading')
    setError('')
    try {
      const raw = await api.getAttemptById(id)

      const attemptRaw = raw.attempt as Record<string, unknown>
      const answersRaw = raw.answers as Record<string, unknown>[]
      const questionsRaw = (raw as Record<string, unknown>).questions as Record<string, unknown>[] | undefined

      let questionsMap: Record<string, Record<string, unknown>> = {}
      if (questionsRaw) {
        for (const q of questionsRaw) {
          questionsMap[q.id as string] = q
        }
      }

      const answers: AnswerDetail[] = answersRaw.map((a) => {
        const q = questionsMap[a.question_id as string] ?? {}
        return {
          questionId: a.question_id as string,
          question: (q.question as string) ?? 'Unknown question',
          options: (q.options as string[]) ?? [],
          selectedAnswer: a.selected_answer as string,
          correctAnswer: (q.correct_answer as string) ?? '',
          explanation: (q.explanation as string) ?? null,
          isCorrect: a.is_correct as boolean,
        }
      })

      setAttempt({
        score: attemptRaw.score as number | null,
        quizTitle: (attemptRaw.quiz_title as string) ?? '',
        courseTitle: (attemptRaw.course_title as string) ?? '',
        courseCode: (attemptRaw.course_code as string) ?? '',
        totalQuestions: answers.length,
        correctAnswers: answers.filter((a) => a.isCorrect).length,
        answers,
      })
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load result')
      setStatus('error')
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <PageShell status={status} error={error} onRetry={fetchData}>
      {attempt && (
        <div className="mx-auto max-w-3xl px-4 py-12 md:px-8">
          <h1 className="text-3xl font-bold text-text-primary">
            {attempt.quizTitle || 'Quiz Result'}
          </h1>
          {attempt.courseTitle && (
            <p className="mt-1 text-sm text-text-muted">
              {attempt.courseCode && <span className="font-medium">{attempt.courseCode}</span>}
              {attempt.courseCode && ' — '}
              {attempt.courseTitle}
            </p>
          )}

          <div className="surface-card mt-6 p-6 text-center">
            <p className="text-sm text-text-muted">Your score</p>
            <p className="mt-1 text-5xl font-bold text-primary">{attempt.score != null ? `${attempt.score}%` : 'N/A'}</p>
            <p className="mt-2 text-sm text-text-muted">
              {attempt.correctAnswers} of {attempt.totalQuestions} correct
            </p>
          </div>

          <div className="mt-8 space-y-6">
            {attempt.answers.map((a, i) => (
              <div key={a.questionId} className="surface-card p-6">
                <p className="mb-3 font-medium text-text-primary">
                  <span className="mr-2 text-text-muted">{i + 1}.</span>
                  {a.question}
                </p>
                {a.options.length > 0 ? (
                  <div className="space-y-2">
                    {a.options.map((opt, i) => {
                      const isSelected = opt === a.selectedAnswer
                      const isCorrectOpt = opt === a.correctAnswer
                      return (
                        <div
                          key={`${a.questionId}-${i}`}
                          className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                            isCorrectOpt
                              ? 'border-secondary bg-secondary-light text-secondary'
                              : isSelected && !a.isCorrect
                                ? 'border-error bg-error/10 text-error'
                                : 'border-border-default bg-white text-text-secondary'
                          }`}
                        >
                          <span className={`h-2 w-2 rounded-full ${
                            isCorrectOpt ? 'bg-secondary' : isSelected ? 'bg-error' : 'bg-border-default'
                          }`} />
                          {opt}
                          {isCorrectOpt && <span className="ml-auto text-xs font-medium text-secondary">Correct</span>}
                          {isSelected && !a.isCorrect && <span className="ml-auto text-xs font-medium text-error">Your answer</span>}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">
                    Your answer: <span className={a.isCorrect ? 'text-secondary' : 'text-error'}>{a.selectedAnswer}</span>
                    {!a.isCorrect && <> &middot; Correct: <span className="text-secondary">{a.correctAnswer}</span></>}
                  </p>
                )}
                {a.explanation && (
                  <p className="mt-3 rounded-lg bg-bg-subtle px-4 py-3 text-sm text-text-muted">
                    {a.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link to="/my-courses" className="text-sm font-medium text-primary hover:text-primary-dark">
              Back to my courses
            </Link>
          </div>
        </div>
      )}
    </PageShell>
  )
}
