import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import LoginPage from './LoginPage'
import MainApp from './MainApp'
import AdminPanel from './components/AdminPanel'
import './App.css'

// Выносим защищенные маршруты в отдельный компонент, который ПОЛУЧАЕТ данные через props
const ProtectedRoutes = () => {
  // Теперь useAuth() вызывается здесь, внутри AuthProvider
  const { user, userProfile, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Загрузка...</p>
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
