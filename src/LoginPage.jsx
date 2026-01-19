/**
 * Страница входа в систему
 * Форма аутентификации пользователя
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import './LoginPage.css'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { signIn } = useAuth()
  const navigate = useNavigate()

  /**
   * Обработка отправки формы
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Валидация
    if (!email || !password) {
      setError('Введите email и пароль')
      setIsLoading(false)
      return
    }

    // Попытка входа
    const result = await signIn(email, password)

    if (result.success) {
      navigate('/', { replace: true })
    } else {
      // Обработка ошибок
      let errorMessage = 'Ошибка входа'

      if (result.error.includes('Invalid login credentials')) {
        errorMessage = 'Неверный email или пароль'
      } else if (result.error.includes('Email not confirmed')) {
        errorMessage = 'Email не подтвержден'
      } else {
        errorMessage = result.error
      }

      setError(errorMessage)
    }

    setIsLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          {/* Логотип / Заголовок */}
          <div className="login-header">
            <div className="login-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="login-title">Учет стоков бара</h1>
            <p className="login-subtitle">Войдите в систему</p>
          </div>

          {/* Форма входа */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Поле Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="example@email.com"
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            {/* Поле Пароль */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Введите пароль"
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            {/* Сообщение об ошибке */}
            {error && (
              <div className="error-message">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="error-icon"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Кнопка входа */}
            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Вход...
                </>
              ) : (
                'Войти'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
