import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageShell from '../components/common/PageShell'
import type { User } from '../types'
import * as api from '../services/api'
import type { FormEvent } from 'react'

export default function AdminCourseEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading')
  const [professors, setProfessors] = useState<User[]>([])
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [code, setCode] = useState('')
  const [professorId, setProfessorId] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    if (!id) return
    setStatus('loading')
    setError('')
    try {
      const [course, users] = await Promise.all([
        api.getCourseById(id),
        api.getAllUsers(),
      ])
      setTitle(course.title)
      setDescription(course.description ?? '')
      setCode(course.code)
      setProfessorId(course.professorId)
      setProfessors(users.filter((u) => u.role === 'professor' && u.status === 'active'))
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course')
      setStatus('error')
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!id) return
    setError('')
    setSaving(true)
    try {
      await api.updateCourse(id, { title, description: description || undefined, code, professorId })
      navigate(`/courses/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update course')
      setSaving(false)
    }
  }

  return (
    <PageShell status={status} error={error} onRetry={fetchData}>
      <div className="mx-auto max-w-xl px-4 py-12 md:px-8">
        <h1 className="text-3xl font-bold text-text-primary">Edit Course</h1>
        <p className="mt-2 text-text-muted">Update course details.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
          )}

          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Title
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border-default bg-white px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-disabled"
            />
          </div>

          <div>
            <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Course Code
            </label>
            <input
              id="code"
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-lg border border-border-default bg-white px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-disabled"
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border-default bg-white px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-disabled"
            />
          </div>

          <div>
            <label htmlFor="professor" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Professor
            </label>
            <select
              id="professor"
              required
              value={professorId}
              onChange={(e) => setProfessorId(e.target.value)}
              className="w-full rounded-lg border border-border-default bg-white px-3 py-2 text-sm text-text-primary outline-none transition-colors"
            >
              <option value="">Select a professor</option>
              {professors.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!title || !code || !professorId || saving}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/courses/${id}`)}
              className="rounded-lg border border-border-default bg-white px-4 py-2.5 font-semibold text-text-secondary transition-colors hover:bg-bg-subtle"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  )
}
