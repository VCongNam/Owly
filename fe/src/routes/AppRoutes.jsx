import { Routes, Route, Navigate } from 'react-router-dom';
import { SignIn, SignUp, AuthCallback, ForgotPassword, ChangePassword } from '../features/auth';
import { DashboardPage } from '../features/dashboard';
import { ClassListPage, ClassDetailPage, ArchivedClassesPage } from '../features/classes';
import { StudentListPage } from '../features/students';
import { DashboardLayout, ProtectedRoute } from '../shared';

export function AppRoutes() {
  return (
    <Routes>
      {/* ── Public routes (no layout) ────────── */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* ── Protected routes (with Dashboard layout) ── */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />

        {/* Classes */}
        <Route path="/classes" element={<ClassListPage />} />
        <Route path="/classes/archived" element={<ArchivedClassesPage />} />
        <Route path="/classes/:classId/*" element={<ClassDetailPage />} />

        {/* Students */}
        <Route path="/students" element={<StudentListPage />} />

        {/* Schedule (placeholder) */}
        <Route path="/schedule" element={<div style={{ padding: 40, opacity: 0.5 }}>📅 Lịch học — đang phát triển</div>} />

        {/* Profile & settings */}
        <Route path="/profile" element={<div style={{ padding: 40, opacity: 0.5 }}>👤 Hồ sơ cá nhân — đang phát triển</div>} />
        <Route path="/change-password" element={<ChangePassword />} />
      </Route>

      {/* ── Catch-all ────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
