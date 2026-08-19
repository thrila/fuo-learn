import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import PageShell from '../components/common/PageShell'
import { Save, User as UserIcon } from 'lucide-react'

export default function ProfilePage() {
  const { user, isLoading, updateStudentProfile } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setFirstName(user?.firstName ?? '')
    setLastName(user?.lastName ?? '')
  }, [user?.firstName, user?.lastName])

  if (isLoading) return <PageShell status="loading" />
  if (!user) return <PageShell status="no_permission" />

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setSaving(true)
    try {
      await updateStudentProfile({ firstName: firstName.trim(), lastName: lastName.trim() })
      setMessage('Your name has been updated.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not update your profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell status="success">
      <div className="mx-auto max-w-2xl px-4 py-12 md:px-8">
        <h1 className="text-3xl font-bold text-text-primary md:text-4xl">Profile</h1>
        <p className="mt-2 text-text-muted">Your account information.</p>

        <div className="surface-card mt-8 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
              <UserIcon className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">{user.firstName} {user.lastName}</h2>
              <p className="text-sm text-text-muted">{user.email}</p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {user.role === 'student' && (
              <form onSubmit={handleSubmit} className="rounded-xl bg-bg-subtle p-4">
                <div className="mb-3">
                  <h3 className="font-semibold text-text-primary">Your name</h3>
                  <p className="text-sm text-text-muted">Keep your learning profile up to date.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="first-name" className="mb-1 block text-sm font-medium text-text-secondary">First name</label>
                    <input id="first-name" required value={firstName} onChange={(event) => setFirstName(event.target.value)} className="w-full rounded-lg border border-border-default bg-white px-3 py-2 text-text-primary outline-none" />
                  </div>
                  <div>
                    <label htmlFor="last-name" className="mb-1 block text-sm font-medium text-text-secondary">Last name</label>
                    <input id="last-name" required value={lastName} onChange={(event) => setLastName(event.target.value)} className="w-full rounded-lg border border-border-default bg-white px-3 py-2 text-text-primary outline-none" />
                  </div>
                </div>
                {message && <p className={`mt-3 text-sm ${message === 'Your name has been updated.' ? 'text-secondary' : 'text-error'}`}>{message}</p>}
                <button disabled={saving || !firstName.trim() || !lastName.trim()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">
                  <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save name'}
                </button>
              </form>
            )}
            <div className="flex items-center justify-between border-b border-border-subtle py-3">
              <span className="text-sm font-medium text-text-muted">Role</span>
              <span className="rounded-full bg-bg-subtle px-3 py-1 text-sm font-medium capitalize text-text-secondary">
                {user.role}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border-subtle py-3">
              <span className="text-sm font-medium text-text-muted">Status</span>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                user.status === 'active' ? 'bg-secondary-light text-secondary' :
                user.status === 'pending' ? 'bg-primary-light text-primary' :
                'bg-error/10 text-error'
              }`}>
                {user.status}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-medium text-text-muted">Email</span>
              <span className="text-sm text-text-primary">{user.email}</span>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
