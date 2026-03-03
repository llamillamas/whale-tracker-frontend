import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/components/ui/toast'
import { Header } from '@/components/Header'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { WhalesPage } from '@/pages/WhalesPage'
import { WhaleProfilePage } from '@/pages/WhaleProfilePage'
import { DashboardPage } from '@/pages/DashboardPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5000 },
  },
})

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header />
      <main>{children}</main>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/whales"
                element={<AppLayout><WhalesPage /></AppLayout>}
              />
              <Route
                path="/whales/:id"
                element={<AppLayout><WhaleProfilePage /></AppLayout>}
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AppLayout><DashboardPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/whales" replace />} />
              <Route path="*" element={<Navigate to="/whales" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
