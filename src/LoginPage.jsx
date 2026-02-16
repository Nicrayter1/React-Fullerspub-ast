/**
 * Страница входа в систему
 * Форма аутентификации пользователя
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Button from './components/ui/Button'
import Input from './components/ui/Input'

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-4">
      <div className="w-full max-w-[400px]">
        <div className="bg-white/95 dark:bg-gray-800/95 rounded-2xl p-8 shadow-heavy animate-slide-up-slow">
          {/* Логотип / Заголовок */}
          <div className="text-center mb-8">
            <div className="w-[60px] h-[60px] mx-auto mb-4 bg-gradient-to-br from-primary to-primary-hover rounded-xl flex items-center justify-center text-white">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-8 h-8"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">Учет стоков бара</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Войдите в систему</p>
          </div>

          {/* Форма входа */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="Email"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              autoComplete="email"
              disabled={isLoading}
            />

            <Input
              label="Пароль"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              autoComplete="current-password"
              disabled={isLoading}
              error={error}
            />

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2"
              loading={isLoading}
            >
              Войти
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
