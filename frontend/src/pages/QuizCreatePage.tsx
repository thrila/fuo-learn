import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as api from '../services/api'
import type { FormEvent } from 'react'

export default function QuizCreatePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!courseId) return
    setError('')
    setCreating(true)
    try {
      const quiz = await api.createQuiz({ courseId, title, description: description || undefined })
      navigate(`/quizzes/${quiz.id}/edit`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quiz')
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 md:px-8">
      <h1 className="text-3xl font-bold text-text-primary">Create Quiz</h1>
      <p className="mt-2 text-text-muted">Create and label a quiz for the students in this course.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
        )}

        <div>
          <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Quiz label
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-border-default bg-white px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-disabled"
            placeholder="e.g. Week 1: Introduction to Biology"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Instructions (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border-default bg-white px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-disabled"
            placeholder="Tell students what this quiz covers"
          />
        </div>

        <button
          type="submit"
          disabled={!title || creating}
          className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create quiz'}
        </button>
      </form>
    </div>
  )
}
