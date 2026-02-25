import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import LoginPage from './LoginPage'
import MainApp from './MainApp'
import AdminPanel from './components/AdminPanel'
import ErrorBoundary from './components/ErrorBoundary'

// Выносим защищенные маршруты в отдельный компонент, который ПОЛУЧАЕТ данные через props
const ProtectedRoutes = () => {
  // Теперь useAuth() вызывается здесь, внутри AuthProvider
  const { user, userProfile, loading, configError } = useAuth()

  if (configError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white p-6">
        <div className="text-5xl mb-4">⚙️</div>
        <h1 className="text-2xl font-bold mb-2">Необходима настройка</h1>
        <p className="text-white/70 mb-4 text-center max-w-md">
          Создайте файл <code className="bg-white/10 px-2 py-0.5 rounded font-mono">.env</code> в корне проекта:
        </p>
        <pre className="bg-black/30 border border-white/20 rounded-xl p-4 text-sm font-mono mb-6 text-left text-green-300">
          {configError}
        </pre>
        <p className="text-white/50 text-sm">После создания файла перезапустите dev-сервер</p>
      </div>
    )
  }

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
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter basename="/React-Fullerspub-ast">
          <ProtectedRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
