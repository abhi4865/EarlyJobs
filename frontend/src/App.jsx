// src/App.jsx
import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import { PageSpinner } from "@/components/common/States";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const CandidatesPage = lazy(() => import("@/pages/CandidatesPage"));
const JobsPage = lazy(() => import("@/pages/JobsPage"));
const PipelinePage = lazy(() => import("@/pages/PipelinePage"));
const InterviewsPage = lazy(() => import("@/pages/InterviewsPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageSpinner label="Signing you in…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="candidates" element={<CandidatesPage />} />
              <Route path="jobs" element={<JobsPage />} />
              <Route path="pipeline" element={<PipelinePage />} />
              <Route path="interviews" element={<InterviewsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
    </AuthProvider>
  );
}
