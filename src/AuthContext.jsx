/**
 * Контекст аутентификации
 * Управляет состоянием пользователя и сессии
 */

import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabaseClient } from './api/supabase'
import supabaseAPI from './api/supabase'

// Создание контекста
const AuthContext = createContext(null)

/**
 * Хук для использования контекста аутентификации
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider')
  }
  return context
}

/**
 * Провайдер аутентификации
 * Оборачивает приложение и предоставляет данные о пользователе
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  /**
   * Загрузка профиля пользователя из таблицы user_profiles
   */
  const loadUserProfile = async (userId) => {
    try {
      const profile = await supabaseAPI.fetchUserProfile(userId)
      setUserProfile(profile)
      return profile
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error)
      setUserProfile(null)
      return null
    }
  }

  /**
   * Инициализация: проверка существующей сессии
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Получаем текущую сессию
        const { data: { session } } = await supabaseClient.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          await loadUserProfile(session.user.id)
        }
      } catch (error) {
        console.error('Ошибка инициализации auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Подписка на изменения состояния аутентификации
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          await loadUserProfile(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setUserProfile(null)
        }
      }
    )

    // Отписка при размонтировании
    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  /**
   * Вход пользователя
   * @param {string} email - Email пользователя
   * @param {string} password - Пароль пользователя
   * @returns {Promise<Object>} Результат входа
   */
  const signIn = async (email, password) => {
    try {
      setLoading(true)

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw error
      }

      if (data.user) {
        setUser(data.user)
        const profile = await loadUserProfile(data.user.id)
        return { success: true, user: data.user, profile }
      }

      return { success: false, error: 'Неизвестная ошибка' }
    } catch (error) {
      console.error('Ошибка входа:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Выход пользователя
   */
  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabaseClient.auth.signOut()

      if (error) {
        throw error
      }

      setUser(null)
      setUserProfile(null)

      // Очищаем localStorage от данных приложения
      localStorage.removeItem('barStockData')
    } catch (error) {
      console.error('Ошибка выхода:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Получение доступных колонок для текущей роли
   * @returns {Array<string>} Массив доступных колонок
   */
  const getAvailableColumns = () => {
    if (!userProfile?.role) return []

    switch (userProfile.role) {
      case 'manager':
        return ['bar1', 'bar2', 'cold_room']
      case 'bar1':
        return ['bar1', 'cold_room']
      case 'bar2':
        return ['bar2']
      default:
        return []
    }
  }

  // Значение контекста
  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signOut,
    getAvailableColumns
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
