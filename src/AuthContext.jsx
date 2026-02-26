/**
 * Контекст аутентификации
 * Управляет состоянием пользователя и сессии
 *
 * ИСПРАВЛЕНО:
 * - Роль загружается из таблицы user_profiles в БД (больше нет хардкода по email)
 * - Если профиль не найден в БД — вход блокируется с понятной ошибкой
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
 * Загружает профиль пользователя из таблицы user_profiles по его id.
 * Роль берётся из БД — хардкода по email больше нет.
 *
 * @param {Object} user - Объект пользователя из Supabase Auth
 * @returns {Object|null} Профиль из БД или null если не найден / ошибка
 */
const fetchProfileFromDB = async (user) => {
  if (!user) {
    warn('⚠️ fetchProfileFromDB: user is null')
    return null
  }

  log('👤 Запрашиваем профиль из user_profiles для:', user.email)

  const { data, error: profileError } = await supabaseClient
    .from('user_profiles')
    .select('id, email, role, created_at, updated_at')
    .eq('id', user.id)
    .single()

  if (profileError) {
    error('❌ Ошибка получения профиля из БД:', profileError)
    return null
  }

  log('✅ Профиль получен из БД:', data)
  return data
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
   * Инициализация: восстанавливаем сессию и загружаем профиль из БД
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

          // Загружаем профиль и роль из таблицы user_profiles
          const profile = await fetchProfileFromDB(session.user)
          if (!profile) {
            error('❌ Профиль не найден в user_profiles. Добавьте запись в таблицу.')
            setUser(null)
            setLoading(false)
            return
          }
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

          // Загружаем профиль и роль из таблицы user_profiles
          const profile = await fetchProfileFromDB(session.user)
          if (!profile) {
            error('❌ Профиль не найден в user_profiles, сбрасываем сессию')
            setUser(null)
            return
          }
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
   * Вход пользователя — роль загружается из БД после успешной авторизации
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

        // Загружаем профиль и роль из таблицы user_profiles
        const profile = await fetchProfileFromDB(data.user)
        if (!profile) {
          // Пользователь есть в auth, но записи в user_profiles нет — блокируем вход
          await supabaseClient.auth.signOut()
          return { success: false, error: 'Профиль пользователя не найден. Обратитесь к менеджеру.' }
        }
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
   * Возвращает колонки, доступные пользователю, на основе роли из БД
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
