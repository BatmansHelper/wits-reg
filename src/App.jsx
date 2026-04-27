import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import OrdersList from './pages/Orders/OrdersList'
import OrderNew from './pages/Orders/OrderNew'
import OrderDetail from './pages/Orders/OrderDetail'
import Users from './pages/Admin/Users'
import UserNew from './pages/Admin/UserNew'
import StepBuilder from './pages/Admin/StepBuilder'
import Universities from './pages/Admin/Universities'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* All authenticated routes — renders with Sidebar + Topbar layout */}
      <Route element={<ProtectedRoute />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/orders" element={<OrdersList />} />
        <Route path="/orders/:orderId" element={<OrderDetail />} />

        {/* admin + super_admin only */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} />}>
          <Route path="/orders/new" element={<OrderNew />} />
        </Route>

        {/* super_admin only */}
        <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/users/new" element={<UserNew />} />
          <Route path="/admin/step-builder" element={<StepBuilder />} />
          <Route path="/admin/universities" element={<Universities />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
