import { Routes, Route, Navigate } from 'react-router-dom';
import { SignIn, SignUp, AuthCallback } from '../features/auth';
import { DashboardPage } from '../features/dashboard';
import { ProtectedRoute } from '../shared';

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      {/* Google OAuth callback — nhận code từ Google, đổi lấy token qua BE */}
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
