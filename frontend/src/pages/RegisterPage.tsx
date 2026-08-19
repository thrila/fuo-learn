import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AlertCircle } from 'lucide-react'
import type { FormEvent } from 'react'
import type { UserRole } from '../types'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('student')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registered, setRegistered] = useState(false)

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!firstName.trim()) errs.firstName = 'First name is required'
    if (!lastName.trim()) errs.lastName = 'Last name is required'
    if (!email.trim()) {
      errs.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Enter a valid email address'
    }
    if (!password) {
      errs.password = 'Password is required'
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters'
    }
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  function clearField(name: string) {
    setFieldErrors((p) => {
      const next = { ...p }
      delete next[name]
      return next
    })
    setError('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const res = await register({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password, role })
      if (res.user.status === 'pending') {
        setRegistered(true)
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      if (err instanceof Error) {
        const msg = err.message
        if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('conflict')) {
          setError('An account with this email already exists. Please sign in or use a different email.')
        } else if (msg.toLowerCase().includes('password')) {
          setError('Password does not meet requirements. Please use at least 8 characters.')
        } else {
          setError(msg)
        }
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (registered) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center gap-3">
            <img src="/FUO_Logo.png" alt="Federal University Otuoke" className="h-20 w-auto" />
            <h1 className="font-heading text-3xl font-bold text-text-primary">FuoLearn</h1>
          </div>
          <div className="surface-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
              <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text-primary">Account created</h2>
            <p className="mt-2 text-sm text-text-muted">
              Your account is pending admin approval. You will be able to sign in once an administrator approves your account.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Go to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src="/FUO_Logo.png" alt="Federal University Otuoke" className="h-20 w-auto" />
          <h1 className="font-heading text-3xl font-bold text-text-primary">FuoLearn</h1>
        </div>

        <div className="surface-card p-8">
          <h2 className="mb-2 text-center text-xl font-semibold text-text-primary">
            Create an account
          </h2>
          <p className="mb-6 text-center text-sm text-text-muted">
            Join the learning platform
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-text-secondary">
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); clearField('firstName') }}
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-disabled ${
                    fieldErrors.firstName ? 'border-error' : 'border-border-default'
                  }`}
                  placeholder="John"
                />
                {fieldErrors.firstName && (
                  <p className="mt-1 text-xs text-error">{fieldErrors.firstName}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-text-secondary">
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => { setLastName(e.target.value); clearField('lastName') }}
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-disabled ${
                    fieldErrors.lastName ? 'border-error' : 'border-border-default'
                  }`}
                  placeholder="Doe"
                />
                {fieldErrors.lastName && (
                  <p className="mt-1 text-xs text-error">{fieldErrors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-text-secondary">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearField('email') }}
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
                onChange={(e) => { setPassword(e.target.value); clearField('password') }}
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-disabled ${
                  fieldErrors.password ? 'border-error' : 'border-border-default'
                }`}
                placeholder="At least 8 characters"
              />
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-error">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-text-secondary">
                I am a
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-lg border border-border-default bg-white px-3 py-2 text-sm text-text-primary outline-none transition-colors"
              >
                <option value="student">Student</option>
                <option value="professor">Professor</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
