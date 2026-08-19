import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/common/PageShell'
import type { Course } from '../types'
import * as api from '../services/api'

export default function CoursesPage() {
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading')
  const [courses, setCourses] = useState<Course[]>([])
  const [error, setError] = useState('')

  const fetchCourses = useCallback(async () => {
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
    fetchCourses()
  }, [fetchCourses])

  return (
    <PageShell status={status} error={error} onRetry={fetchCourses}>
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <h1 className="text-3xl font-bold text-text-primary md:text-4xl">Courses</h1>
        <p className="mt-2 text-text-muted">Browse all available courses.</p>

        {courses.length === 0 ? (
          <p className="mt-10 text-center text-text-muted">No courses available yet.</p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="surface-card block p-6 transition-transform duration-150 hover:-translate-y-0.5"
              >
                <p className="text-sm font-medium text-primary">{course.code}</p>
                <h3 className="mt-1 font-semibold text-text-primary">{course.title}</h3>
                {course.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-text-muted">{course.description}</p>
                )}
                <p className="mt-3 text-xs text-text-disabled">Prof. {course.professorName}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  )
}
