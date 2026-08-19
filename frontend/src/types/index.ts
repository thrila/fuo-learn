export type UserRole = 'admin' | 'professor' | 'student'

export type UserStatus = 'pending' | 'active' | 'disabled'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  status: UserStatus
  createdAt: string
}

export interface Course {
  id: string
  title: string
  description: string | null
  code: string
  professorId: string
  professorName: string
  professorEmail: string
  createdAt: string
  updatedAt: string
}

export type EnrollmentStatus = 'pending' | 'approved' | 'rejected'

export interface Enrollment {
  id: string
  courseId: string
  studentId: string
  status: EnrollmentStatus
  courseTitle: string
  courseCode: string
  studentName: string
  studentEmail: string
  createdAt: string
  updatedAt: string
}

export interface Material {
  id: string
  courseId: string
  title: string
  fileType: string
  fileKey: string
  uploadedBy: string
  uploaderName: string
  createdAt: string
}

export type QuizGenerationStatus = 'pending' | 'generating' | 'completed' | 'failed'

export interface Quiz {
  id: string
  courseId: string
  title: string
  description: string | null
  isPublished: boolean
  generationStatus: QuizGenerationStatus | null
  createdBy: string
  courseTitle: string
  courseCode: string
  createdAt: string
  updatedAt: string
}

export interface Question {
  id: string
  quizId: string
  question: string
  options: string[]
  correctAnswer: string | null
  explanation: string | null
  sortOrder: number
  createdAt: string
}

export type AttemptStatus = 'in_progress' | 'completed'

export interface QuizAttempt {
  id: string
  quizId: string
  studentId: string
  score: number | null
  startedAt: string
  completedAt: string | null
  quizTitle: string
  courseTitle: string
  courseCode: string
  totalQuestions: number
  correctAnswers: number
}

export interface AttemptAnswer {
  id: string
  attemptId: string
  questionId: string
  selectedAnswer: string
  isCorrect: boolean
  createdAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
}

export interface AuthResponse {
  user: User
  accessToken: string
}
