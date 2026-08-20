import { Routes, Route, Navigate } from 'react-router-dom';
import { SignIn, SignUp, AuthCallback, ForgotPassword, ChangePassword } from '../features/auth';
import { DashboardPage } from '../features/dashboard';
import { ClassListPage, ClassDetailPage, ArchivedClassesPage, AssignmentCreatePage } from '../features/classes';
import { StudentListPage } from '../features/students';
import { SchedulePage } from '../features/schedule';
import { DashboardLayout, ProtectedRoute } from '../shared';
import { LandingPage } from '../features/landing';
import { ProfilePage } from '../features/profile/components/ProfilePage';

export function AppRoutes() {
  return (
    <Routes>
      {/* ── Public routes (no layout) ────────── */}
      <Route path="/" element={<LandingPage />} />
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
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Classes */}
        <Route path="/classes" element={<ClassListPage />} />
        <Route path="/classes/archived" element={<ArchivedClassesPage />} />
        <Route path="/classes/:classId/assignments/create" element={<AssignmentCreatePage />} />
        <Route path="/classes/:classId/*" element={<ClassDetailPage />} />

        {/* Students */}
        <Route path="/students" element={<StudentListPage />} />

        {/* Schedule */}
        <Route path="/schedule" element={<SchedulePage />} />

        {/* Profile & settings */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/change-password" element={<ChangePassword />} />
      </Route>

      {/* ── Catch-all ────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
