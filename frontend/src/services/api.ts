import type {
  User, Course, Enrollment, Material, Quiz, Question, QuizAttempt,
  AuthResponse, LoginCredentials, RegisterCredentials, EnrollmentStatus,
} from '../types'
import { api, stripHashes } from '../lib/api'

function toUser(raw: Record<string, unknown>): User {
  return {
    id: raw.id as string,
    email: raw.email as string,
    firstName: (raw.firstName ?? raw.first_name) as string,
    lastName: (raw.lastName ?? raw.last_name) as string,
    role: raw.role as User['role'],
    status: raw.status as User['status'],
    createdAt: (raw.created_at ?? raw.createdAt) as string,
  }
}

function toCourse(raw: Record<string, unknown>): Course {
  return {
    id: raw.id as string,
    title: raw.title as string,
    description: (raw.description ?? null) as string | null,
    code: raw.code as string,
    professorId: raw.professor_id as string,
    professorName: `${raw.professor_first_name ?? ''} ${raw.professor_last_name ?? ''}`.trim(),
    professorEmail: (raw.professor_email ?? '') as string,
    createdAt: raw.created_at as string,
    updatedAt: raw.updated_at as string,
  }
}

function toEnrollment(raw: Record<string, unknown>): Enrollment {
  return {
    id: raw.id as string,
    courseId: raw.course_id as string,
    studentId: raw.student_id as string,
    status: raw.status as EnrollmentStatus,
    courseTitle: (raw.course_title ?? '') as string,
    courseCode: (raw.course_code ?? '') as string,
    studentName: `${raw.student_first_name ?? ''} ${raw.student_last_name ?? ''}`.trim(),
    studentEmail: (raw.student_email ?? '') as string,
    createdAt: raw.created_at as string,
    updatedAt: raw.updated_at as string,
  }
}

function toMaterial(raw: Record<string, unknown>): Material {
  const id = raw.id as string
  return {
    id,
    courseId: raw.course_id as string,
    title: raw.title as string,
    fileType: raw.file_type as string,
    fileKey: raw.file_key as string,
    uploadedBy: raw.uploaded_by as string,
    uploaderName: `${raw.uploader_first_name ?? ''} ${raw.uploader_last_name ?? ''}`.trim(),
    createdAt: raw.created_at as string,
  }
}

function toQuiz(raw: Record<string, unknown>): Quiz {
  return {
    id: raw.id as string,
    courseId: raw.course_id as string,
    title: raw.title as string,
    description: (raw.description ?? null) as string | null,
    isPublished: raw.is_published as boolean,
    generationStatus: raw.generation_status as Quiz['generationStatus'],
    createdBy: raw.created_by as string,
    courseTitle: (raw.course_title ?? '') as string,
    courseCode: (raw.course_code ?? '') as string,
    createdAt: raw.created_at as string,
    updatedAt: raw.updated_at as string,
  }
}

function toQuestion(raw: Record<string, unknown>): Question {
  return {
    id: raw.id as string,
    quizId: raw.quiz_id as string,
    question: raw.question as string,
    options: raw.options as string[],
    correctAnswer: (raw.correct_answer ?? null) as string | null,
    explanation: (raw.explanation ?? null) as string | null,
    sortOrder: raw.sort_order as number,
    createdAt: raw.created_at as string,
  }
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toNumber(value: unknown, fallback = 0): number {
  return toNullableNumber(value) ?? fallback
}

function toAttempt(raw: Record<string, unknown>): QuizAttempt {
  return {
    id: raw.id as string,
    quizId: raw.quiz_id as string,
    studentId: raw.student_id as string,
    score: toNullableNumber(raw.score),
    startedAt: raw.started_at as string,
    completedAt: (raw.completed_at ?? null) as string | null,
    quizTitle: (raw.quiz_title ?? '') as string,
    courseTitle: (raw.course_title ?? '') as string,
    courseCode: (raw.course_code ?? '') as string,
    totalQuestions: toNumber(raw.total_questions),
    correctAnswers: toNumber(raw.correct_answers),
  }
}

// Auth
export function login(credentials: LoginCredentials): Promise<AuthResponse> {
  return api.post<AuthResponse>('/auth/login', credentials)
}

export function register(credentials: RegisterCredentials): Promise<AuthResponse> {
  return api.post<AuthResponse>('/auth/register', credentials)
}

// Users (admin)
export async function getAllUsers(): Promise<User[]> {
  const data = await api.get<{ users: Record<string, unknown>[] }>('/auth/users')
  return stripHashes(data.users).map(toUser)
}

export async function getPendingUsers(): Promise<User[]> {
  const data = await api.get<{ users: Record<string, unknown>[] }>('/auth/users/pending')
  return stripHashes(data.users).map(toUser)
}

export async function approveUser(id: string): Promise<User> {
  const data = await api.patch<{ user: Record<string, unknown> }>(`/auth/users/${id}/approve`)
  return toUser(data.user)
}

export async function disableUser(id: string): Promise<User> {
  const data = await api.patch<{ user: Record<string, unknown> }>(`/auth/users/${id}/disable`)
  return toUser(data.user)
}

export async function updateStudentProfile(body: { firstName: string; lastName: string }): Promise<User> {
  const data = await api.patch<{ user: Record<string, unknown> }>('/auth/profile', body)
  return toUser(data.user)
}

// Courses
export async function getCourses(): Promise<Course[]> {
  const data = await api.get<{ courses: Record<string, unknown>[] }>('/courses')
  return data.courses.map(toCourse)
}

export async function getCourseById(id: string): Promise<Course> {
  const data = await api.get<{ course: Record<string, unknown> }>(`/courses/${id}`)
  return toCourse(data.course)
}

export async function createCourse(body: { title: string; description?: string; code: string; professorId: string }): Promise<Course> {
  const data = await api.post<{ course: Record<string, unknown> }>('/courses', body)
  return toCourse(data.course)
}

export async function updateCourse(id: string, body: { title?: string; description?: string; code?: string; professorId?: string }): Promise<Course> {
  const data = await api.patch<{ course: Record<string, unknown> }>(`/courses/${id}`, body)
  return toCourse(data.course)
}

export function deleteCourse(id: string): Promise<void> {
  return api.delete<void>(`/courses/${id}`)
}

// Enrollments
export async function enrollInCourse(courseId: string): Promise<Enrollment> {
  const data = await api.post<{ enrollment: Record<string, unknown> }>(`/courses/${courseId}/enroll`)
  return toEnrollment(data.enrollment)
}

export async function getCourseEnrollments(courseId: string): Promise<Enrollment[]> {
  const data = await api.get<{ enrollments: Record<string, unknown>[] }>(`/courses/${courseId}/enrollments`)
  return data.enrollments.map(toEnrollment)
}

export async function getMyEnrollments(): Promise<Enrollment[]> {
  const data = await api.get<{ enrollments: Record<string, unknown>[] }>('/enrollments/mine')
  return data.enrollments.map(toEnrollment)
}

export async function updateEnrollmentStatus(id: string, status: EnrollmentStatus): Promise<Enrollment> {
  const data = await api.patch<{ enrollment: Record<string, unknown> }>(`/enrollments/${id}/status`, { status })
  return toEnrollment(data.enrollment)
}

// Materials
export async function getCourseMaterials(courseId: string): Promise<Material[]> {
  const data = await api.get<{ materials: Record<string, unknown>[] }>(`/courses/${courseId}/materials`)
  return data.materials.map(toMaterial)
}

export async function getMaterialById(id: string): Promise<Material> {
  const data = await api.get<{ material: Record<string, unknown> }>(`/materials/${id}`)
  return toMaterial(data.material)
}

export async function downloadMaterialFile(id: string): Promise<Blob> {
  const API_BASE = import.meta.env.VITE_API_URL ?? ''
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}/materials/${id}/file`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error?.message ?? `Could not load material (${res.status})`)
  }

  return res.blob()
}

export async function uploadMaterial(courseId: string, file: File, title?: string): Promise<{ material: Record<string, unknown> }> {
  const formData = new FormData()
  formData.append('file', file)
  if (title) formData.append('title', title)

  const API_BASE = import.meta.env.VITE_API_URL ?? ''
  const res = await fetch(`${API_BASE}/courses/${courseId}/materials`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: formData,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error?.message ?? `Upload failed (${res.status})`)
  }
  return res.json()
}

export function deleteMaterial(id: string): Promise<void> {
  return api.delete<void>(`/materials/${id}`)
}

// Quizzes
export async function getCourseQuizzes(courseId: string): Promise<Quiz[]> {
  const data = await api.get<{ quizzes: Record<string, unknown>[] }>(`/courses/${courseId}/quizzes`)
  return data.quizzes.map(toQuiz)
}

export async function getQuizById(id: string): Promise<Quiz> {
  const data = await api.get<{ quiz: Record<string, unknown> }>(`/quizzes/${id}`)
  return toQuiz(data.quiz)
}

export async function getQuizQuestions(id: string): Promise<Question[]> {
  const data = await api.get<{ questions: Record<string, unknown>[] }>(`/quizzes/${id}/questions`)
  return data.questions.map(toQuestion)
}

export async function createQuiz(body: { courseId: string; title: string; description?: string }): Promise<Quiz> {
  const data = await api.post<{ quiz: Record<string, unknown> }>('/quizzes', body)
  return toQuiz(data.quiz)
}

export async function updateQuiz(id: string, body: { title?: string; description?: string }): Promise<Quiz> {
  const data = await api.patch<{ quiz: Record<string, unknown> }>(`/quizzes/${id}`, body)
  return toQuiz(data.quiz)
}

export async function publishQuiz(id: string): Promise<Quiz> {
  const data = await api.post<{ quiz: Record<string, unknown> }>(`/quizzes/${id}/publish`)
  return toQuiz(data.quiz)
}

export async function unpublishQuiz(id: string): Promise<Quiz> {
  const data = await api.post<{ quiz: Record<string, unknown> }>(`/quizzes/${id}/unpublish`)
  return toQuiz(data.quiz)
}

export async function addQuestion(quizId: string, body: {
  question: string
  options: string[]
  correctAnswer: string
  explanation?: string
  sortOrder?: number
}): Promise<Question> {
  const data = await api.post<{ question: Record<string, unknown> }>(`/quizzes/${quizId}/questions`, body)
  return toQuestion(data.question)
}

export function deleteQuiz(id: string): Promise<void> {
  return api.delete<void>(`/quizzes/${id}`)
}

export function deleteQuestion(quizId: string, questionId: string): Promise<void> {
  return api.delete<void>(`/quizzes/${quizId}/questions/${questionId}`)
}

// Quiz Attempts
export async function startQuizAttempt(quizId: string): Promise<{ attemptId: string }> {
  return api.post<{ attemptId: string }>(`/quizzes/${quizId}/attempts`)
}

export function submitQuizAttempt(attemptId: string, answers: { questionId: string; selectedAnswer: string }[]): Promise<{ score: number; total: number; correct: number }> {
  return api.post<{ score: number; total: number; correct: number }>(`/attempts/${attemptId}/submit`, { answers })
}

export async function getAttemptById(id: string): Promise<{ attempt: Record<string, unknown>; answers: Record<string, unknown>[]; questions: Record<string, unknown>[] }> {
  return api.get(`/attempts/${id}`)
}

export async function getMyAttempts(): Promise<QuizAttempt[]> {
  const data = await api.get<{ attempts: Record<string, unknown>[] }>('/attempts/mine')
  return data.attempts.map(toAttempt)
}

export async function enableUser(id: string): Promise<User> {
  const data = await api.patch<{ user: Record<string, unknown> }>(`/auth/users/${id}/approve`)
  return toUser(data.user)
}

export function generateQuizFromMaterial(materialId: string, numberOfQuestions?: number): Promise<{ quiz: Record<string, unknown> }> {
  return api.post<{ quiz: Record<string, unknown> }>(`/materials/${materialId}/generate-quiz`, numberOfQuestions ? { numberOfQuestions } : undefined)
}
