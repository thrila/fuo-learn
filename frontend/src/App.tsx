import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/common/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import CoursesPage from './pages/CoursesPage'
import CourseDetailPage from './pages/CourseDetailPage'
import MyCoursesPage from './pages/MyCoursesPage'
import ProgressPage from './pages/ProgressPage'
import EnrollmentsPage from './pages/EnrollmentsPage'
import QuizzesPage from './pages/QuizzesPage'
import QuizCreatePage from './pages/QuizCreatePage'
import QuizEditPage from './pages/QuizEditPage'
import QuizReviewPage from './pages/QuizReviewPage'
import QuizTakePage from './pages/QuizTakePage'
import AttemptResultPage from './pages/AttemptResultPage'
import MaterialUploadPage from './pages/MaterialUploadPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminCoursesPage from './pages/AdminCoursesPage'
import AdminCourseCreatePage from './pages/AdminCourseCreatePage'
import AdminCourseEditPage from './pages/AdminCourseEditPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
          <Route
            path="/courses/:courseId/enrollments"
            element={<EnrollmentsPage />}
          />
          <Route
            path="/courses/:courseId/materials/upload"
            element={<MaterialUploadPage />}
          />
          <Route path="/courses/:courseId/quizzes" element={<QuizzesPage />} />
          <Route
            path="/courses/:courseId/quizzes/new"
            element={<QuizCreatePage />}
          />
          <Route path="/my-courses" element={<MyCoursesPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/quizzes/:id/take" element={<QuizTakePage />} />
          <Route path="/quizzes/:id/edit" element={<QuizEditPage />} />
          <Route path="/quizzes/:id/review" element={<QuizReviewPage />} />
          <Route path="/attempts/:id" element={<AttemptResultPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/courses" element={<AdminCoursesPage />} />
          <Route path="/admin/courses/new" element={<AdminCourseCreatePage />} />
          <Route path="/admin/courses/:id/edit" element={<AdminCourseEditPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}
