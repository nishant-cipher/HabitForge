import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "@/contexts/AuthContext"
import { ToastProvider } from "@/contexts/ToastContext"
import { useNotificationPermission } from "@/hooks/useNotifications"
import { MainLayout } from "@/components/layouts/MainLayout"
import { Dashboard } from "@/pages/Dashboard"
import { Login } from "@/pages/Login"
import { Register } from "@/pages/Register"
import { Habits } from "@/pages/Habits"
import { Tasks } from "@/pages/Tasks"
import { Clubs } from "@/pages/Clubs"
import { ClubDetail } from "@/pages/ClubDetail"
import { Analytics } from "@/pages/Analytics"
import { Settings } from "@/pages/Settings"
import { ModeConfig } from "@/pages/ModeConfig"
import { ProtectedRoute } from "@/components/ProtectedRoute"

/** Requests browser notification permission once on first app load */
function AppShell({ children }: { children: React.ReactNode }) {
  useNotificationPermission()
  return <>{children}</>
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <AppShell>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/habits" element={<Habits />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/clubs" element={<Clubs />} />
                  <Route path="/clubs/:clubId" element={<ClubDetail />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/mode" element={<ModeConfig />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </AppShell>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
