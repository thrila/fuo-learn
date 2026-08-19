import { useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageShell from '../components/common/PageShell'
import type { Quiz, Question } from '../types'
import * as api from '../services/api'

export default function QuizEditPage() {
  const { id } = useParams<{ id: string }>()

  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading')
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [error, setError] = useState('')

  const [questionText, setQuestionText] = useState('')
  const [quizTitle, setQuizTitle] = useState('')
  const [quizDescription, setQuizDescription] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [explanation, setExplanation] = useState('')
  const [adding, setAdding] = useState(false)
  const [savingDetails, setSavingDetails] = useState(false)
  const [publishing, setPublishing] = useState(false)

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
      setQuizTitle(q.title)
      setQuizDescription(q.description ?? '')
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

  function addOption() {
    setOptions((prev) => [...prev, ''])
  }

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => i === index ? value : o))
  }

  function removeOption(index: number) {
    if (options.length <= 2) return
    const removed = options[index]
    setOptions((prev) => prev.filter((_, i) => i !== index))
    if (correctAnswer === removed) {
      setCorrectAnswer('')
    }
  }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    setError('')
    setAdding(true)
    try {
      const q = await api.addQuestion(id, {
        question: questionText,
        options: options.filter((o) => o.trim()),
        correctAnswer,
        explanation: explanation || undefined,
      })
      setQuestions((prev) => [...prev, q])
      setQuestionText('')
      setOptions(['', ''])
      setCorrectAnswer('')
      setExplanation('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add question')
    } finally {
      setAdding(false)
    }
  }

  async function handleSaveDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!id || !quizTitle.trim()) return
    setSavingDetails(true)
    setError('')
    try {
      const updatedQuiz = await api.updateQuiz(id, {
        title: quizTitle.trim(),
        description: quizDescription.trim() || undefined,
      })
      setQuiz(updatedQuiz)
      setQuizTitle(updatedQuiz.title)
      setQuizDescription(updatedQuiz.description ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quiz details')
    } finally {
      setSavingDetails(false)
    }
  }

  async function handlePublish() {
    if (!id || questions.length === 0) return
    setError('')
    setPublishing(true)
    try {
      const updatedQuiz = await api.publishQuiz(id)
      setQuiz(updatedQuiz)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish')
    } finally {
      setPublishing(false)
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

  async function handleDeleteQuestion(questionId: string) {
    if (!id) return
    if (!window.confirm('Are you sure you want to delete this question?')) return
    try {
      await api.deleteQuestion(id, questionId)
      setQuestions((prev) => prev.filter((q) => q.id !== questionId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question')
    }
  }

  return (
    <PageShell status={status} error={error} onRetry={fetchData}>
      {quiz && (
        <div className="mx-auto max-w-3xl px-4 py-12 md:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">{quiz.title}</h1>
              <p className="mt-1 text-sm text-text-muted">
                {quiz.courseCode} &middot; {questions.length} questions
              </p>
            </div>
            <div className="flex gap-2">
              {quiz.isPublished ? (
                <button
                  type="button"
                  onClick={handleUnpublish}
                  className="rounded-lg border border-border-default bg-white px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-subtle"
                >
                  Unpublish
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={questions.length === 0 || publishing}
                  className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark disabled:opacity-50"
                >
                  {publishing ? 'Publishing...' : 'Publish'}
                </button>
              )}
              <Link
                to={`/courses/${quiz.courseId}`}
                className="rounded-lg border border-border-default bg-white px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-subtle"
              >
                Back to course
              </Link>
            </div>
          </div>

          {error && (
            <div role="alert" className="mt-5 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          {!quiz.isPublished && questions.length === 0 && (
            <p className="mt-4 text-sm text-text-muted">Add at least one question before publishing this quiz.</p>
          )}

          {questions.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-4 text-lg font-semibold text-text-primary">Questions</h2>
              <div className="space-y-3">
                {questions.map((q, i) => (
                  <div key={q.id} className="surface-card p-5">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-text-primary">
                        <span className="mr-2 text-text-muted">{i + 1}.</span>
                        {q.question}
                      </p>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="shrink-0 rounded-lg bg-error/10 px-2 py-1 text-xs font-medium text-error transition-colors hover:bg-error/20"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="mt-2 space-y-1">
                      {q.options.map((opt) => (
                        <p key={opt} className={`text-sm ${opt === q.correctAnswer ? 'font-medium text-secondary' : 'text-text-muted'}`}>
                          {opt} {opt === q.correctAnswer && '(correct)'}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Quiz details</h2>
            <form onSubmit={handleSaveDetails} className="surface-card space-y-4 p-5">
              <div>
                <label htmlFor="quiz-title" className="mb-1.5 block text-sm font-medium text-text-secondary">Quiz label</label>
                <input
                  id="quiz-title"
                  required
                  value={quizTitle}
                  onChange={(event) => setQuizTitle(event.target.value)}
                  className="w-full rounded-lg border border-border-default bg-white px-3 py-2 text-sm text-text-primary outline-none"
                />
              </div>
              <div>
                <label htmlFor="quiz-description" className="mb-1.5 block text-sm font-medium text-text-secondary">Instructions</label>
                <textarea
                  id="quiz-description"
                  value={quizDescription}
                  onChange={(event) => setQuizDescription(event.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border-default bg-white px-3 py-2 text-sm text-text-primary outline-none"
                  placeholder="Tell students what this quiz covers"
                />
              </div>
              <button
                type="submit"
                disabled={savingDetails || !quizTitle.trim()}
                className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-light disabled:opacity-50"
              >
                {savingDetails ? 'Saving...' : 'Save quiz details'}
              </button>
            </form>
          </section>

          <section className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Add question</h2>
            <form onSubmit={handleAddQuestion} className="surface-card space-y-4 p-5">
              <div>
                <label htmlFor="question" className="mb-1.5 block text-sm font-medium text-text-secondary">Question</label>
                <textarea
                  id="question"
                  required
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border-default bg-white px-3 py-2 text-sm text-text-primary outline-none transition-colors"
                  placeholder="Enter the question"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">Options</label>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        className="flex-1 rounded-lg border border-border-default bg-white px-3 py-2 text-sm text-text-primary outline-none transition-colors"
                        placeholder={`Option ${i + 1}`}
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(i)}
                          className="rounded-lg bg-error/10 px-2 text-sm text-error hover:bg-error/20"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-2 text-sm font-medium text-primary hover:text-primary-dark"
                >
                  + Add option
                </button>
              </div>

              <div>
                <label htmlFor="correct" className="mb-1.5 block text-sm font-medium text-text-secondary">Correct answer</label>
                <select
                  id="correct"
                  required
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  className="w-full rounded-lg border border-border-default bg-white px-3 py-2 text-sm text-text-primary outline-none transition-colors"
                >
                  <option value="">Select correct answer</option>
                  {options.filter((o) => o.trim()).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="explanation" className="mb-1.5 block text-sm font-medium text-text-secondary">Explanation (optional)</label>
                <input
                  id="explanation"
                  type="text"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="w-full rounded-lg border border-border-default bg-white px-3 py-2 text-sm text-text-primary outline-none transition-colors"
                  placeholder="Why is this the correct answer?"
                />
              </div>

              <button
                type="submit"
                disabled={adding}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add question'}
              </button>
            </form>
          </section>
        </div>
      )}
    </PageShell>
  )
}
