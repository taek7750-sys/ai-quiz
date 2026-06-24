import { Navigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const isAdmin = useStore((s) => s.isAdmin)
  return isAdmin ? <>{children}</> : <Navigate to="/admin/login" replace />
}
