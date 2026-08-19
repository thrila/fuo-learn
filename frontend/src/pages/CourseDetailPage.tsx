import { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import PageShell from '../components/common/PageShell'
import { BookOpen, FileText, Sparkles } from 'lucide-react'
import type { Course, Material, Quiz, Enrollment } from '../types'
import * as api from '../services/api'

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading')
  const [course, setCourse] = useState<Course | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [selectedMaterialUrl, setSelectedMaterialUrl] = useState<string | null>(null)
  const [viewingMaterialId, setViewingMaterialId] = useState<string | null>(null)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [editingDescription, setEditingDescription] = useState(false)
  const [courseDescription, setCourseDescription] = useState('')
  const [savingDescription, setSavingDescription] = useState(false)

  const fetchData = useCallback(async () => {
    if (!id) return
    setStatus('loading')
    setError('')
    try {
      const [c, qs] = await Promise.all([
        api.getCourseById(id),
        api.getCourseQuizzes(id),
      ])
      setCourse(c)
      setCourseDescription(c.description ?? '')
      setQuizzes(qs)

      let approvedForMaterials = user?.role !== 'student'
      if (user?.role === 'student') {
        const enrollments = await api.getMyEnrollments()
        const found = enrollments.find((e) => e.courseId === id) ?? null
        setEnrollment(found)
        approvedForMaterials = found?.status === 'approved'
      }

      setMaterials(approvedForMaterials ? await api.getCourseMaterials(id) : [])
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course')
      setStatus('error')
    }
  }, [id, user?.role])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleEnroll() {
    if (!id) return
    setActionError('')
    setEnrolling(true)
    try {
      const e = await api.enrollInCourse(id)
      setEnrollment(e)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to request enrollment')
    } finally {
      setEnrolling(false)
    }
  }

  async function handleGenerateQuiz(materialId: string) {
    setGeneratingId(materialId)
    try {
      const result = await api.generateQuizFromMaterial(materialId)
      const quiz = result.quiz as { id: string }
      navigate(`/quizzes/${quiz.id}/edit`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz')
      setGeneratingId(null)
    }
  }

  const canManage = user?.role === 'admin' || (user?.role === 'professor' && user.id === course?.professorId)
  const isEnrolled = enrollment?.status === 'approved'

  async function handleDeleteMaterial(materialId: string) {
    if (!window.confirm('Are you sure you want to delete this material? This action cannot be undone.')) return
    try {
      await api.deleteMaterial(materialId)
      setMaterials((prev) => prev.filter((m) => m.id !== materialId))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete material')
    }
  }

  async function handleViewMaterial(material: Material) {
    setActionError('')
    setViewingMaterialId(material.id)
    try {
      const file = await api.downloadMaterialFile(material.id)
      const objectUrl = URL.createObjectURL(file)
      setSelectedMaterialUrl((previousUrl) => {
        if (previousUrl) URL.revokeObjectURL(previousUrl)
        return objectUrl
      })
      setSelectedMaterial(material)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not open material')
    } finally {
      setViewingMaterialId(null)
    }
  }

  async function handleSaveDescription(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!course) return
    setActionError('')
    setSavingDescription(true)
    try {
      const updatedCourse = await api.updateCourse(course.id, {
        title: course.title,
        description: courseDescription.trim() || undefined,
      })
      setCourse(updatedCourse)
      setCourseDescription(updatedCourse.description ?? '')
      setEditingDescription(false)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update the course description')
    } finally {
      setSavingDescription(false)
    }
  }

  useEffect(() => () => {
    if (selectedMaterialUrl) URL.revokeObjectURL(selectedMaterialUrl)
  }, [selectedMaterialUrl])

  return (
    <PageShell status={status} error={error} onRetry={fetchData}>
      {course && (
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <div className="mb-8 rounded-2xl border border-border-subtle bg-bg-surface p-6 shadow-sm md:p-8">
            <p className="inline-flex rounded-full bg-primary-light px-3 py-1 text-sm font-semibold text-primary">{course.code}</p>
            <h1 className="mt-4 text-3xl font-bold text-text-primary md:text-4xl">{course.title}</h1>
            {course.description && !editingDescription && (
              <p className="content-measure mt-3 text-text-secondary">{course.description}</p>
            )}
            {canManage && !editingDescription && (
              <button
                onClick={() => setEditingDescription(true)}
                className="mt-3 text-sm font-semibold text-primary hover:text-primary-dark"
              >
                {course.description ? 'Edit course description' : 'Add a short course description'}
              </button>
            )}
            {canManage && editingDescription && (
              <form onSubmit={handleSaveDescription} className="mt-4 max-w-2xl">
                <label htmlFor="course-description" className="mb-1.5 block text-sm font-medium text-text-secondary">Short course description</label>
                <textarea
                  id="course-description"
                  value={courseDescription}
                  onChange={(event) => setCourseDescription(event.target.value)}
                  rows={3}
                  maxLength={2000}
                  className="w-full rounded-lg border border-border-default bg-white px-3 py-2 text-sm text-text-primary outline-none"
                  placeholder="Briefly explain what students will learn in this course"
                />
                <div className="mt-2 flex gap-2">
                  <button disabled={savingDescription} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">
                    {savingDescription ? 'Saving...' : 'Save description'}
                  </button>
                  <button type="button" onClick={() => { setCourseDescription(course.description ?? ''); setEditingDescription(false) }} className="rounded-lg px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-bg-subtle">
                    Cancel
                  </button>
                </div>
              </form>
            )}
            <div className="mt-4 flex items-center gap-2 text-sm text-text-muted">
              <BookOpen className="h-4 w-4 text-primary" /> Prof. {course.professorName}
            </div>
          </div>

          {actionError && (
            <div className="mb-6 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">{actionError}</div>
          )}

          {user?.role === 'student' && !isEnrolled && (
            <div className="mb-8">
              {enrollment?.status === 'pending' ? (
                <span className="rounded-full bg-primary-light px-4 py-2 text-sm font-medium text-primary">
                  Enrollment pending
                </span>
              ) : enrollment?.status === 'rejected' ? (
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-error/10 px-4 py-2 text-sm font-medium text-error">
                    Enrollment rejected
                  </span>
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
                  >
                    {enrolling ? 'Requesting...' : 'Request again'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
                >
                  {enrolling ? 'Requesting...' : 'Request enrollment'}
                </button>
              )}
            </div>
          )}

          {canManage && (
            <div className="mb-8 flex gap-3">
              <Link
                to={`/courses/${course.id}/enrollments`}
                className="rounded-lg border border-border-default bg-white px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-subtle"
              >
                Enrollment requests
              </Link>
              <Link
                to={`/courses/${course.id}/materials/upload`}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                Upload material
              </Link>
              <Link
                to={`/courses/${course.id}/quizzes/new`}
                className="rounded-lg border border-border-default bg-white px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-subtle"
              >
                Create quiz
              </Link>
            </div>
          )}

          <section className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-text-primary">Materials</h2>
            </div>
            {materials.length === 0 ? (
              <p className="text-sm text-text-muted">No materials uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {materials.map((m) => (
                  <div key={m.id} className="surface-card flex flex-col gap-4 p-4 transition-transform duration-150 hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary-light p-2 text-primary"><FileText className="h-5 w-5" /></div>
                      <div>
                      <h3 className="font-medium text-text-primary">{m.title}</h3>
                      <p className="text-xs text-text-muted">{m.fileType} &middot; {m.uploaderName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canManage && (
                        <>
                          <button
                            onClick={() => handleGenerateQuiz(m.id)}
                            disabled={generatingId === m.id}
                            className="flex items-center gap-1.5 rounded-lg bg-primary-light px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-50"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            {generatingId === m.id ? 'Generating...' : 'Generate Quiz'}
                          </button>
                          <button
                            onClick={() => handleDeleteMaterial(m.id)}
                            className="rounded-lg bg-error/10 px-3 py-1.5 text-sm font-medium text-error transition-colors hover:bg-error/20"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleViewMaterial(m)}
                        disabled={viewingMaterialId === m.id}
                        className="rounded-lg border border-border-default bg-white px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-subtle"
                      >
                        {viewingMaterialId === m.id ? 'Opening...' : 'View'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedMaterial && selectedMaterialUrl && (
              <div className="surface-card mt-5 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default px-4 py-3">
                  <div>
                    <h3 className="font-semibold text-text-primary">{selectedMaterial.title}</h3>
                    <p className="text-xs text-text-muted">{selectedMaterial.fileType}</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={selectedMaterialUrl}
                      download={selectedMaterial.title}
                      className="rounded-lg border border-border-default bg-white px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-bg-subtle"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => {
                        URL.revokeObjectURL(selectedMaterialUrl)
                        setSelectedMaterial(null)
                        setSelectedMaterialUrl(null)
                      }}
                      className="rounded-lg bg-bg-subtle px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-border-default"
                    >
                      Close
                    </button>
                  </div>
                </div>
                {selectedMaterial.fileType === 'application/pdf' ? (
                  <iframe
                    title={selectedMaterial.title}
                    src={selectedMaterialUrl}
                    className="h-[70vh] w-full bg-white"
                  />
                ) : (
                  <div className="p-6 text-sm text-text-muted">
                    This PowerPoint file is ready to download and open with PowerPoint or LibreOffice.
                  </div>
                )}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-secondary" />
              <h2 className="text-xl font-bold text-text-primary">Quizzes</h2>
            </div>
            {quizzes.length === 0 ? (
              <p className="text-sm text-text-muted">No quizzes available yet.</p>
            ) : (
              <div className="space-y-3">
                {quizzes.map((q) => (
                  <div key={q.id} className="surface-card flex flex-col gap-4 p-4 transition-transform duration-150 hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-medium text-text-primary">{q.title}</h3>
                      {q.description && <p className="mt-1 text-sm text-text-muted">{q.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        q.isPublished ? 'bg-secondary-light text-secondary' : 'bg-bg-subtle text-text-muted'
                      }`}>
                        {q.isPublished ? 'Published' : 'Draft'}
                      </span>
                      {canManage ? (
                        <Link
                          to={q.isPublished ? `/quizzes/${q.id}/review` : `/quizzes/${q.id}/edit`}
                          className="rounded-lg border border-border-default bg-white px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-subtle"
                        >
                          Manage
                        </Link>
                      ) : q.isPublished && isEnrolled ? (
                        <Link
                          to={`/quizzes/${q.id}/take`}
                          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                        >
                          Take quiz
                        </Link>
                      ) : q.isPublished ? (
                        <span className="text-xs text-text-disabled">Enroll to access</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </PageShell>
  )
}
