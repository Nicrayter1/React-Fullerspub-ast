/**
 * Контекст аутентификации
 * Управляет состоянием пользователя и сессии
 * 
 * ИСПРАВЛЕНО:
 * - Роль определяется по email вместо запроса к user_profiles
 * - Добавлены логи для отладки
 */

import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabaseClient } from './api/supabase'
import { log, warn, error, isDev } from './utils/logger'

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
 * НОВОЕ: Определение роли пользователя по email
 * @param {string} email - Email пользователя
 * @returns {string} Роль пользователя
 */
const getRoleFromEmail = (email) => {
  if (!email) {
    warn('⚠️ getRoleFromEmail: email is null')
    return 'bar1' // По умолчанию
  }
  
  const emailLower = email.toLowerCase()
  log('🔍 Определение роли для email:', emailLower)
  
  if (emailLower === 'manager@fullerspub.local') {
    log('✅ Роль: manager')
    return 'manager'
  } else if (emailLower === 'bar1@fullerspub.local') {
    log('✅ Роль: bar1')
    return 'bar1'
  } else if (emailLower === 'bar2@fullerspub.local') {
    log('✅ Роль: bar2')
    return 'bar2'
  }
  
  warn('⚠️ Неизвестный email, используем роль bar1 по умолчанию')
  return 'bar1'
}

/**
 * НОВОЕ: Создание объекта профиля из данных пользователя
 * @param {Object} user - Объект пользователя из Supabase Auth
 * @returns {Object} Профиль пользователя
 */
const createUserProfile = (user) => {
  if (!user) {
    warn('⚠️ createUserProfile: user is null')
    return null
  }
  
  log('👤 Создание профиля для:', user.email)
  
  const role = getRoleFromEmail(user.email)
  
  const profile = {
    id: user.id,
    email: user.email,
    role: role,
    created_at: user.created_at,
    updated_at: user.updated_at
  }
  
  log('✅ Создан профиль:', profile)
  
  return profile
}

/**
 * Провайдер аутентификации
 * Оборачивает приложение и предоставляет данные о пользователе
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [configError, setConfigError] = useState(null)

  /**
   * ИСПРАВЛЕНО: Инициализация с определением роли по email
   */
  useEffect(() => {
    // Если Supabase не настроен — сразу завершаем загрузку с ошибкой конфигурации
    if (!supabaseClient) {
      setConfigError(
        'Создайте файл .env в корне проекта:\n' +
        'VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
        'VITE_SUPABASE_ANON_KEY=your_anon_key_here'
      )
      setLoading(false)
      return
    }

    const initAuth = async () => {
      try {
        log('🔐 Инициализация аутентификации...')
        
        // Получаем текущую сессию
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()

        if (sessionError) {
          error('❌ Ошибка получения сессии:', sessionError)
          throw sessionError
        }

        if (session?.user) {
          log('✅ Сессия найдена:', session.user.email)
          setUser(session.user)

          // Создаем профиль на основе email (БЕЗ запроса к базе)
          const profile = createUserProfile(session.user)
          setUserProfile(profile)
        } else {
          log('ℹ️ Активной сессии нет')
        }
      } catch (err) {
        error('❌ Ошибка инициализации auth:', err)
        setUser(null)
        setUserProfile(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Подписка на изменения состояния аутентификации
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        log('🔄 Auth state change:', event)
        
        if (event === 'SIGNED_IN' && session?.user) {
          log('✅ Пользователь вошел:', session.user.email)
          setUser(session.user)
          
          // Создаем профиль на основе email (БЕЗ запроса к базе)
          const profile = createUserProfile(session.user)
          setUserProfile(profile)
          
        } else if (event === 'SIGNED_OUT') {
          log('👋 Пользователь вышел')
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
   * ИСПРАВЛЕНО: Вход пользователя с определением роли по email
   */
  const signIn = async (email, password) => {
    if (!supabaseClient) {
      return { success: false, error: 'Supabase не настроен. Проверьте файл .env' }
    }
    try {
      setLoading(true)
      log('🔐 Попытка входа:', email)

      const { data, error: signInError } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        error('❌ Ошибка входа:', signInError)
        throw signInError
      }

      if (data.user) {
        log('✅ Вход успешен:', data.user.email)
        setUser(data.user)

        // Создаем профиль на основе email (БЕЗ запроса к базе)
        const profile = createUserProfile(data.user)
        setUserProfile(profile)

        return { success: true, user: data.user, profile }
      }

      return { success: false, error: 'Неизвестная ошибка' }
    } catch (err) {
      error('❌ Ошибка входа:', err)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Выход пользователя
   */
  const signOut = async () => {
    if (!supabaseClient) {
      setUser(null)
      setUserProfile(null)
      return
    }
    try {
      setLoading(true)
      log('👋 Выход пользователя...')
      
      const { error: signOutError } = await supabaseClient.auth.signOut()

      if (signOutError) {
        error('❌ Ошибка выхода:', signOutError)
        throw signOutError
      }

      setUser(null)
      setUserProfile(null)

      // Очищаем localStorage от данных приложения
      localStorage.removeItem('barStockData')
      log('✅ Выход выполнен, localStorage очищен')

    } catch (err) {
      error('❌ Ошибка выхода:', err)
      // Даже если ошибка, пытаемся очистить локальное состояние
      setUser(null)
      setUserProfile(null)
      localStorage.removeItem('barStockData')
    } finally {
      setLoading(false)
    }
  }

  /**
   * ИСПРАВЛЕНО: Получение доступных колонок с отладочными логами
   * @returns {Array<string>} Массив доступных колонок
   */
  const getAvailableColumns = () => {
    log('🔍 getAvailableColumns вызвана')
    log('📧 User email:', user?.email)
    log('🎭 User role:', userProfile?.role)
    
    if (!userProfile?.role) {
      warn('⚠️ Роль не определена, возвращаем пустой массив')
      return []
    }

    let columns = []
    
    switch (userProfile.role) {
      case 'manager':
        columns = ['bar1', 'bar2', 'cold_room']
        log('✅ Manager role: все колонки', columns)
        break
      case 'bar1':
        columns = ['bar1', 'cold_room']
        log('✅ Bar1 role: bar1 и cold_room', columns)
        break
      case 'bar2':
        columns = ['bar2']
        log('✅ Bar2 role: только bar2', columns)
        break
      default:
        warn('⚠️ Неизвестная роль:', userProfile.role)
        columns = []
    }
    
    return columns
  }

  // Значение контекста
  const value = {
    user,
    userProfile,
    loading,
    configError,
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
