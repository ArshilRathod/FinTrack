import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AuthProvider } from './hooks/useAuth';
import { SettingsProvider } from './hooks/useSettings';
import { NotificationsProvider } from './contexts/NotificationsContext';

const AuthPage = lazy(() => import('./pages/AuthPage').then((module) => ({ default: module.AuthPage })));
const EducationPage = lazy(() => import('./pages/EducationPage').then((module) => ({ default: module.EducationPage })));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage').then((module) => ({ default: module.ExpensesPage })));
const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })));
const InsightsPage = lazy(() => import('./pages/InsightsPage').then((module) => ({ default: module.InsightsPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then((module) => ({ default: module.NotificationsPage })));
const FinanceDiaryPage = lazy(() => import('./pages/FinanceDiaryPage').then((module) => ({ default: module.FinanceDiaryPage })));
const ComparisonsPage = lazy(() => import('./pages/ComparisonsPage').then((module) => ({ default: module.ComparisonsPage })));
const LoansPage = lazy(() => import('./pages/LoansPage').then((module) => ({ default: module.LoansPage })));
const LoanBreakdownPage = lazy(() => import('./pages/LoanBreakdownPage').then((module) => ({ default: module.LoanBreakdownPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then((module) => ({ default: module.ResetPasswordPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const WelcomePage = lazy(() => import('./pages/WelcomePage').then((module) => ({ default: module.WelcomePage })));

const queryClient = new QueryClient();
const pageFallback = (
  <div className="flex min-h-screen items-center justify-center bg-app px-6 text-sm font-medium text-slate-500 dark:text-slate-400">
    Loading FinTrack...
  </div>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <Suspense fallback={pageFallback}>
            <Routes>
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/signup" element={<AuthPage mode="signup" />} />
              <Route path="/forgot-password" element={<ResetPasswordPage />} />
              <Route
                path="/welcome"
                element={
                  <ProtectedRoute>
                    <NotificationsProvider>
                      <WelcomePage />
                    </NotificationsProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <NotificationsProvider>
                      <AppShell />
                    </NotificationsProvider>
                  </ProtectedRoute>
                }
              >
                <Route index element={<HomePage />} />
                <Route path="expenses" element={<ExpensesPage />} />
                <Route path="diary" element={<FinanceDiaryPage />} />
                <Route path="comparisons" element={<ComparisonsPage />} />
                <Route path="loans" element={<LoansPage />} />
                <Route path="loans/:id/breakdown" element={<LoanBreakdownPage />} />
                <Route path="education" element={<EducationPage />} />
                <Route path="insights" element={<InsightsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
