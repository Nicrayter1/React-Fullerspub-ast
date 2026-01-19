/**
 * Главный компонент приложения
 * Маршрутизация и защита роутов
 */

import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import LoginPage from './LoginPage'
import MainApp from './MainApp'

import './App.css'

/**
 * Компонент защищенного маршрута
 * Редирект на /login если пользователь не авторизован
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  // Показываем загрузку пока проверяем сессию
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p className="loading-text">Загрузка...</p>
      </div>
    )
  }

  // Редирект на login если нет пользователя
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

/**
 * Компонент публичного маршрута (только для неавторизованных)
 * Редирект на / если пользователь уже авторизован
 */
function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  // Показываем загрузку пока проверяем сессию
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p className="loading-text">Загрузка...</p>
      </div>
    )
  }

  // Редирект на главную если пользователь уже авторизован
  if (user) {
    return <Navigate to="/" replace />
  }

  return children
}

/**
 * Основной компонент с маршрутизацией
 */
function AppRoutes() {
  return (
    <Routes>
      {/* Публичный маршрут - страница входа */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Защищенный маршрут - главное приложение */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainApp />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

/**
 * Корневой компонент приложения
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
