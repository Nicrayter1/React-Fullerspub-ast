import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import LoginPage from './LoginPage'
import MainApp from './MainApp'
import AdminPanel from './components/AdminPanel'
import './App.css'

function AppRoutes() {
  // Защищенный маршрут для админ-панели (только manager)
  const AdminRoute = ({ children }) => {
    const { user, userProfile, loading } = useAuth()

    if (loading) {
      return (
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Загрузка...</p>
        </div>
      )
    }

    if (!user) {
      return <Navigate to="/login" replace />
    }

    if (userProfile?.role !== 'manager') {
      return <Navigate to="/" replace />
    }

    return children
  }

  // Защищенный маршрут
  const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth()

    if (loading) {
      return (
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Загрузка...</p>
        </div>
      )
    }

    if (!user) {
      return <Navigate to="/login" replace />
    }

    return children
  }

  // Публичный маршрут
  const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth()

    if (loading) {
      return (
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Загрузка...</p>
        </div>
      )
    }

    if (user) {
      return <Navigate to="/" replace />
    }

    return children
  }

  return (
    <BrowserRouter basename="/React-Fullerspub-ast">
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
