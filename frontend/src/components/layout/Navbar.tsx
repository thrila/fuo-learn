import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu, X, User } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

const studentLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/courses', label: 'Courses' },
  { to: '/my-courses', label: 'My Courses' },
  { to: '/progress', label: 'Progress' },
]

const professorLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/courses', label: 'Courses' },
  { to: '/my-courses', label: 'My Courses' },
]

const adminLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/courses', label: 'Courses' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/courses', label: 'Manage Courses' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!user) return null

  const links =
    user.role === 'admin'
      ? adminLinks
      : user.role === 'professor'
        ? professorLinks
        : studentLinks

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function isActive(to: string) {
    return location.pathname === to || location.pathname.startsWith(to + '/')
  }

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border-subtle bg-bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 md:px-8">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <img src="/FUO_Logo.png" alt="FUO" className="h-10 w-auto" />
          <span className="font-heading text-lg font-bold text-text-primary">FuoLearn</span>
        </Link>

        <nav className="hidden items-center gap-2 rounded-xl border border-border-subtle bg-bg-subtle p-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? 'bg-primary-light text-primary'
                  : 'text-text-secondary hover:bg-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            to="/profile"
            className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-subtle sm:flex"
          >
            <User className="h-4 w-4" />
            {user.firstName}
          </Link>
          <button
            onClick={handleLogout}
            className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-subtle sm:flex"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex items-center rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-subtle md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-border-subtle bg-bg-surface px-4 py-3 md:hidden">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? 'bg-primary-light text-primary'
                  : 'text-text-secondary hover:bg-bg-subtle'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/profile"
            onClick={() => setMobileOpen(false)}
            className="block rounded-lg px-4 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-subtle"
          >
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-subtle"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </nav>
      )}
    </header>
  )
}
