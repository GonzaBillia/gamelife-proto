import { BrowserRouter, Link, Route, Routes, Navigate } from 'react-router-dom'
import { ThemeProvider } from './components/providers/theme-provider'
import Page from './pages/AuthPage'
import AuthCallback from './pages/AuthCallback'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <nav style={{ display: 'flex', gap: 12, padding: 12 }}>
          <Link to="/auth">Auth</Link>
          <Link to="/tasks">Tasks</Link>
        </nav>

        <Routes>
          <Route path="/auth" element={<Page />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}