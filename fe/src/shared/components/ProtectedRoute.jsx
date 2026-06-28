import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth';

/**
 * ProtectedRoute — Bảo vệ route chỉ cho phép user đã đăng nhập truy cập.
 * Nếu chưa đăng nhập, redirect về /signin.
 *
 * Sử dụng:
 *   <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
 */
export function ProtectedRoute({ children, redirectTo = '/signin' }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

export default ProtectedRoute;
