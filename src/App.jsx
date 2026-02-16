import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import LoginPage from './LoginPage'
import MainApp from './MainApp'
import AdminPanel from './components/AdminPanel'

// Выносим защищенные маршруты в отдельный компонент, который ПОЛУЧАЕТ данные через props
const ProtectedRoutes = () => {
  // Теперь useAuth() вызывается здесь, внутри AuthProvider
  const { user, userProfile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white transition-colors">
        <div className="w-12 h-12 border-4 border-white/20 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-white/80 animate-pulse">Загрузка...</p>
      </div>
    )
  }

  return (
    <Routes>
      {/* Публичный маршрут */}
      <Route
        path="/login"
        element={
          !user ? (
            <LoginPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      
      {/* Админ-панель (только manager) */}
      <Route
        path="/admin"
        element={
          user && userProfile?.role === 'manager' ? (
            <AdminPanel />
          ) : (
            <Navigate to={user ? "/" : "/login"} replace />
          )
        }
      />
      
      {/* Основное приложение (требуется авторизация) */}
      <Route
        path="/*"
        element={
          user ? (
            <MainApp />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/React-Fullerspub-ast">
        <ProtectedRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
