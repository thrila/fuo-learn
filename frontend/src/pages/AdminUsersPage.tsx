import { useCallback, useEffect, useState } from 'react'
import PageShell from '../components/common/PageShell'
import type { User } from '../types'
import * as api from '../services/api'

export default function AdminUsersPage() {
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading')
  const [users, setUsers] = useState<User[]>([])
  const [filter, setFilter] = useState<'all' | 'pending'>('all')
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  const fetchData = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      const data = filter === 'pending' ? await api.getPendingUsers() : await api.getAllUsers()
      setUsers(data)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
      setStatus('error')
    }
  }, [filter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleApprove(id: string) {
    setActionId(id)
    setActionError('')
    try {
      await api.approveUser(id)
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: 'active' as const } : u))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to approve user')
    } finally {
      setActionId(null)
    }
  }

  async function handleDisable(id: string) {
    setActionId(id)
    setActionError('')
    try {
      await api.disableUser(id)
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: 'disabled' as const } : u))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to disable user')
    } finally {
      setActionId(null)
    }
  }

  async function handleEnable(id: string) {
    setActionId(id)
    setActionError('')
    try {
      await api.enableUser(id)
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: 'active' as const } : u))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to enable user')
    } finally {
      setActionId(null)
    }
  }

  return (
    <PageShell status={status} error={error} onRetry={fetchData}>
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <h1 className="text-3xl font-bold text-text-primary md:text-4xl">Users</h1>
        <p className="mt-2 text-text-muted">Manage platform users.</p>

        {actionError && (
          <div className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">{actionError}</div>
        )}

        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-primary text-white' : 'bg-bg-subtle text-text-secondary hover:bg-bg-sidebar'
            }`}
          >
            All users
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'pending' ? 'bg-primary text-white' : 'bg-bg-subtle text-text-secondary hover:bg-bg-sidebar'
            }`}
          >
            Pending
          </button>
        </div>

        {users.length === 0 ? (
          <p className="mt-10 text-center text-text-muted">No users found.</p>
        ) : (
          <div className="mt-6 space-y-3">
            {users.map((u) => (
              <div key={u.id} className="surface-card flex items-center justify-between p-5">
                <div>
                  <h3 className="font-semibold text-text-primary">{u.firstName} {u.lastName}</h3>
                  <p className="text-sm text-text-muted">{u.email}</p>
                  <div className="mt-1.5 flex gap-2">
                    <span className="rounded-full bg-bg-subtle px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                      {u.role}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      u.status === 'active' ? 'bg-secondary-light text-secondary' :
                      u.status === 'pending' ? 'bg-primary-light text-primary' :
                      'bg-error/10 text-error'
                    }`}>
                      {u.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {u.status === 'pending' && (
                    <button
                      onClick={() => handleApprove(u.id)}
                      disabled={actionId === u.id}
                      className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark disabled:opacity-50"
                    >
                      Approve
                    </button>
                  )}
                  {u.status === 'active' && (
                    <button
                      onClick={() => handleDisable(u.id)}
                      disabled={actionId === u.id}
                      className="rounded-lg bg-error/10 px-3 py-1.5 text-sm font-semibold text-error transition-colors hover:bg-error/20 disabled:opacity-50"
                    >
                      Disable
                    </button>
                  )}
                  {u.status === 'disabled' && (
                    <button
                      onClick={() => handleEnable(u.id)}
                      disabled={actionId === u.id}
                      className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark disabled:opacity-50"
                    >
                      Enable
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  )
}
