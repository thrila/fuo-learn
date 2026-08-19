import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AlertCircle } from 'lucide-react'
import type { FormEvent } from 'react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function validate(): boolean {
    const errs: { email?: string; password?: string } = {}
    if (!email.trim()) {
      errs.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Enter a valid email address'
    }
    if (!password) {
      errs.password = 'Password is required'
    }
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    if (!validate()) return

    setIsSubmitting(true)
    try {
      await login({ email: email.trim(), password })
      navigate('/dashboard')
    } catch (err) {
      if (err instanceof Error) {
        const msg = err.message
        if (msg.toLowerCase().includes('pending')) {
          setError('Your account is pending admin approval. Please wait for an administrator to approve your account before signing in.')
        } else if (msg.toLowerCase().includes('disabled')) {
          setError('Your account has been disabled. Please contact an administrator.')
        } else if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('password')) {
          setError('Invalid email or password. Please check your credentials and try again.')
        } else {
          setError(msg)
        }
      } else {
        setError('Login failed. Please try again.')
      }
      setPassword('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src="/FUO_Logo.png" alt="Federal University Otuoke" className="h-20 w-auto" />
          <h1 className="font-heading text-3xl font-bold text-text-primary">EduMatrix</h1>
        </div>

        <div className="surface-card p-8">
          <h2 className="mb-2 text-center text-xl font-semibold text-text-primary">
            Welcome back
          </h2>
          <p className="mb-6 text-center text-sm text-text-muted">
            Sign in to your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-text-secondary">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })); setError('') }}
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-disabled ${
                  fieldErrors.email ? 'border-error' : 'border-border-default'
                }`}
                placeholder="you@example.com"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-error">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-text-secondary">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); setError('') }}
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-disabled ${
                  fieldErrors.password ? 'border-error' : 'border-border-default'
                }`}
                placeholder="Enter your password"
              />
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-error">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-muted">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:text-primary-dark">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
