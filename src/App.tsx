// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "@/pages/AuthPage"
import SignUpPage from "@/pages/SignUpPage"
import AuthCallback from "@/pages/AuthCallback"
import AppLayout from "@/pages/app/AppLayout"
import TodayPage from "@/pages/app/TodayPage"
import OnboardingProfilePage from "@/pages/OnboardingProfilePage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<LoginPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* onboarding */}
        <Route path="/onboarding/profile" element={<OnboardingProfilePage />} />

        {/* app */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="/app/today" replace />} />
          <Route path="today" element={<TodayPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}