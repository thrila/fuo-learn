import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-bg-base font-ui text-text-secondary">
      <Navbar />
      <div className="pt-20">
        <Outlet />
      </div>
    </div>
  )
}
