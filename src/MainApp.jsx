/**
 * Главный компонент приложения после авторизации
 * Управляет состоянием и координирует работу всех компонентов
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Save, Upload, Download, RefreshCw, LogOut, User } from 'lucide-react'
import { useAuth } from './AuthContext'

// Импорт компонентов
import Notification from './components/Notification'
import SearchInput from './components/SearchInput'
import NumberEditModal from './components/NumberEditModal'
import AddModal from './components/AddModal'
import ProductList from './ProductList'

// Импорт утилит
import { parseNumber } from './utils/format'
import { exportToCSV } from './utils/export'

// Импорт API
import supabaseAPI from './api/supabase'

import './MainApp.css'

function MainApp() {
  const { user, userProfile, signOut, getAvailableColumns } = useAuth()

  // === STATE MANAGEMENT ===

  // Данные
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])

  // UI состояние
  const [searchQuery, setSearchQuery] = useState('')
  const [notification, setNotification] = useState({ message: '', type: 'info' })
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)

  // Модальные окна
  const [editModal, setEditModal] = useState({
    isOpen: false,
    product: null,
    field: '',
    title: ''
  })
  const [addModal, setAddModal] = useState({
    isOpen: false,
    type: 'product'
  })

  // Доступные колонки для текущего пользователя
  const availableColumns = getAvailableColumns()

  // === УВЕДОМЛЕНИЯ ===

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type })
  }, [])

  // === РАБОТА С LOCALSTORAGE ===

  const loadFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem('barStockData')
      if (saved) {
        const data = JSON.parse(saved)
        setCategories(data.categories || [])
        setProducts(data.products || [])
        return true
      }
    } catch (error) {
      console.error('Ошибка загрузки из localStorage:', error)
    }
    return false
  }, [])

  const saveToLocalStorage = useCallback(() => {
    try {
      localStorage.setItem('barStockData', JSON.stringify({ categories, products }))
      showNotification('Данные сохранены локально!', 'success')
      return true
    } catch (error) {
      showNotification('Ошибка сохранения: ' + error.message, 'error')
      return false
    }
  }, [categories, products, showNotification])

  // === РАБОТА С SUPABASE ===

  /**
   * Загрузка данных из Supabase
   */
  const loadFromSupabase = useCallback(async () => {
    try {
      setLoading(true)
      showNotification('Загрузка данных из базы...', 'info')
      console.log('📥 Начало загрузки из Supabase...')

      const cats = await supabaseAPI.fetchCategories()
      const prods = await supabaseAPI.fetchProducts()

      // Обогащение продуктов названиями категорий
      const enrichedProducts = prods.map(prod => {
        const category = cats.find(cat => cat.id === prod.category_id)
        return {
          ...prod,
          category_name: category ? category.name : 'Без категории',
          cold_room: prod.cold_room || 0
        }
      })

      setCategories(cats)
      setProducts(enrichedProducts)

      // Сохранение в localStorage как backup
      localStorage.setItem('barStockData', JSON.stringify({
        categories: cats,
        products: enrichedProducts
      }))

      console.log('✅ Данные загружены из Supabase')
      showNotification('Данные загружены!', 'success')
    } catch (error) {
      console.error('❌ Ошибка загрузки из Supabase:', error)
      showNotification('Ошибка загрузки из БД. Используем локальные данные', 'error')
      loadFromLocalStorage()
    } finally {
      setLoading(false)
    }
  }, [showNotification, loadFromLocalStorage])

  /**
   /**
 * ============================================================
 * ИСПРАВЛЕННЫЙ ФРАГМЕНТ MainApp.jsx
 * ============================================================
 * 
 * Замените функцию saveToSupabase (строки 137-181) на эту версию
 * 
 * ИСПРАВЛЕНИЯ:
 * ✅ Правильная обработка результата syncAll (updated вместо succeeded)
 * ✅ Показ понятных сообщений из result.userMessage
 * ✅ Различное поведение для полного успеха / частичного / провала
 * ✅ Сохранение localStorage даже при частичном успехе
 * ============================================================
 */

  /**
   * Сохранение в Supabase с улучшенной обработкой ошибок
   * 
   * ВЕРСИЯ v2.1 - ИСПРАВЛЕНО
   * - Использует result.userMessage для уведомлений
   * - Не падает при частичном успехе
   * - Правильно обрабатывает CORS ошибки
   */
  const saveToSupabase = useCallback(async () => {
    // ============================================================
    // ВАЛИДАЦИЯ
    // ============================================================
    if (!products || products.length === 0) {
      showNotification('Нет данных для сохранения', 'error')
      return
    }

    try {
      setLoading(true)
      showNotification('Сохранение в базу данных...', 'info')
      
      console.log(`💾 Начало сохранения ${products.length} продуктов...`)
      
      // ============================================================
      // ВЫЗОВ BULK RPC
      // ============================================================
      const result = await supabaseAPI.syncAll(products)
      
      console.log('✅ Результат сохранения:', result)
      
      // ============================================================
      // ОБРАБОТКА РЕЗУЛЬТАТА
      // ============================================================
      
      if (result.success) {
        // ПОЛНЫЙ УСПЕХ
        showNotification(
          result.userMessage || `Данные сохранены! Обновлено ${result.updated} из ${result.total} продуктов`,
          'success'
        )
        
        // Обновляем localStorage
        saveToLocalStorage()
        
      } else if (result.updated > 0) {
        // ЧАСТИЧНЫЙ УСПЕХ
        showNotification(
          result.userMessage || `Частично сохранено: ${result.updated} из ${result.total} продуктов. Попробуйте снова.`,
          'warning'
        )
        
        // Даже при частичном успехе сохраняем в localStorage
        saveToLocalStorage()
        
        // Показываем детали если это CORS ошибка
        if (result.hasCORSErrors) {
          console.warn('⚠️ Обнаружены CORS ошибки. Советы:')
          console.warn('   1. Проверьте интернет-соединение')
          console.warn('   2. Попробуйте обновить страницу')
          console.warn('   3. Проверьте настройки CORS в Supabase')
        }
        
      } else {
        // ПОЛНЫЙ ПРОВАЛ
        showNotification(
          result.userMessage || 'Не удалось сохранить данные. Попробуйте снова.',
          'error'
        )
        
        // Специальный совет для CORS ошибок
        if (result.hasCORSErrors) {
          setTimeout(() => {
            showNotification(
              'Совет: Проверьте интернет-соединение и попробуйте обновить страницу',
              'info'
            )
          }, 2000)
        }
      }
      
    } catch (error) {
      // ============================================================
      // ОБРАБОТКА КРИТИЧЕСКИХ ОШИБОК
      // ============================================================
      console.error('❌ Критическая ошибка сохранения в Supabase:', error)
      
      // Формируем понятное сообщение
      let errorMessage = 'Ошибка сохранения: '
      
      if (error.message?.includes('CORS') || error.message?.includes('cors')) {
        errorMessage = 'Проблема с подключением к серверу. Проверьте интернет-соединение.'
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Проблема с сетью. Проверьте подключение к интернету.'
      } else if (error.message) {
        errorMessage += error.message
      } else {
        errorMessage = 'Неизвестная ошибка. Попробуйте обновить страницу.'
      }
      
      showNotification(errorMessage, 'error')
      
    } finally {
      // ============================================================
      // ФИНАЛИЗАЦИЯ
      // ============================================================
      // КРИТИЧНО: Всегда сбрасываем loading
      setLoading(false)
      console.log('🏁 Сохранение завершено, loading = false')
    }
  }, [products, showNotification, saveToLocalStorage])

/**
 * ============================================================
 * КОНЕЦ ИСПРАВЛЕННОГО ФРАГМЕНТА
 * ============================================================
 * 
 * ДОПОЛНИТЕЛЬНО: Если у вас нет типа уведомления 'warning',
 * добавьте его в компонент Notification.jsx:
 * 
 * const types = {
 *   success: { icon: '✓', color: 'green' },
 *   error: { icon: '✗', color: 'red' },
 *   info: { icon: 'ℹ', color: 'blue' },
 *   warning: { icon: '⚠', color: 'orange' }  // <- Добавьте эту строку
 * }
 * ============================================================
 */
  /**
   * Синхронизация с Supabase (загрузка свежих данных)
   */
  const syncWithSupabase = useCallback(async () => {
    if (window.confirm('Загрузить данные из базы? Текущие изменения будут потеряны.')) {
      console.log('🔄 Пользователь подтвердил синхронизацию')
      await loadFromSupabase()
    } else {
      console.log('❌ Синхронизация отменена пользователем')
    }
  }, [loadFromSupabase])

  // === ИНИЦИАЛИЗАЦИЯ ===

  /**
   * Инициализация приложения при первом рендере
   * Загружает данные из localStorage или Supabase
   */
  useEffect(() => {
    const init = async () => {
      console.log('🚀 Инициализация приложения...')
      
      // Пробуем загрузить из localStorage
      const hasLocalData = loadFromLocalStorage()
      
      if (!hasLocalData || products.length === 0) {
        console.log('📥 Локальных данных нет, загружаем из Supabase...')
        // Если нет локальных данных, загружаем из Supabase
        if (supabaseAPI.client) {
          await loadFromSupabase()
        } else {
          showNotification('Настройте подключение к Supabase', 'info')
        }
      } else {
        console.log('✅ Данные загружены из localStorage')
      }
    }
    
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Выполняется только при первом монтировании

  // === ОБРАБОТЧИКИ ДЕЙСТВИЙ ===

  const handleEdit = (product, field) => {
    // Проверяем, что пользователь имеет доступ к этой колонке
    if (!availableColumns.includes(field)) {
      showNotification('У вас нет доступа к редактированию этой колонки', 'error')
      return
    }

    const titles = {
      bar1: 'Бар 1',
      bar2: 'Бар 2',
      cold_room: 'Холод. комната'
    }
    setEditModal({
      isOpen: true,
      product,
      field,
      title: `${product.name} - ${titles[field]}`
    })
  }

  const handleConfirmEdit = (value) => {
    const numValue = parseNumber(value)
    setProducts(prev => prev.map(p =>
      p.id === editModal.product.id
        ? { ...p, [editModal.field]: numValue }
        : p
    ))
    setEditModal({ isOpen: false, product: null, field: '', title: '' })
  }

  const handleAddItem = ({ category, name, volume }) => {
    const categoryObj = categories.find(c =>
      c.name.toLowerCase() === category.toLowerCase()
    )

    if (addModal.type === 'category') {
      const exists = categories.some(c =>
        c.name.toLowerCase() === category.toLowerCase()
      )
      if (!exists) {
        const newCategory = {
          id: Date.now(),
          name: category,
          order_index: categories.length + 1
        }
        setCategories(prev => [...prev, newCategory])
        showNotification(`Категория "${category}" добавлена`, 'success')
      } else {
        alert('Такая категория уже существует')
      }
    } else {
      if (!categoryObj) {
        alert('Категория не найдена')
        return
      }
      const newProduct = {
        id: Date.now(),
        category_id: categoryObj.id,
        name,
        volume,
        bar1: 0,
        bar2: 0,
        cold_room: 0,
        category_name: category
      }
      setProducts(prev => [...prev, newProduct])
      showNotification(`Продукт "${name}" добавлен`, 'success')
    }
    setAddModal({ isOpen: false, type: 'product' })
  }

  const handleExport = () => {
    exportToCSV(products)
    showNotification('CSV файл скачивается...', 'success')
  }

  const handleSignOut = async () => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
      await signOut()
    }
  }

  // Получение отображаемого имени роли
  const getRoleDisplayName = (role) => {
    const roleNames = {
      manager: 'Менеджер',
      bar1: 'Бар 1',
      bar2: 'Бар 2'
    }
    return roleNames[role] || role
  }

  // === RENDER ===

  return (
    <div className="main-app">
      {/* Шапка с информацией о пользователе */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">Учет стоков бара</h1>

          <div className="user-info">
            <div className="user-details">
              <User className="user-icon" />
              <div className="user-text">
                <span className="user-email">{user?.email}</span>
                <span className="user-role">{getRoleDisplayName(userProfile?.role)}</span>
              </div>
            </div>
            <button onClick={handleSignOut} className="logout-button">
              <LogOut className="logout-icon" />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="app-main">
        <div className="content-container">
          {/* Уведомления */}
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification({ message: '', type: 'info' })}
          />

          {/* Поиск */}
          <SearchInput value={searchQuery} onChange={setSearchQuery} />

          {/* Навигация по категориям */}
          <div className="category-nav">
            <button
              className={`category-nav-btn ${activeCategory === null ? 'active' : ''}`}
              onClick={() => setActiveCategory(null)}
            >
              Все
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`category-nav-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Кнопки действий */}
          {userProfile?.role === 'manager' && (
            <div className="action-buttons">
              <button
                onClick={() => setAddModal({ isOpen: true, type: 'product' })}
                className="action-btn add-product"
              >
                <Plus className="btn-icon" /> Добавить продукт
              </button>
              <button
                onClick={() => setAddModal({ isOpen: true, type: 'category' })}
                className="action-btn add-category"
              >
                <Plus className="btn-icon" /> Добавить категорию
              </button>
            </div>
          )}

          <div className="action-buttons">
            <button
              onClick={syncWithSupabase}
              disabled={loading}
              className="action-btn sync"
            >
              <RefreshCw className={`btn-icon ${loading ? 'spinning' : ''}`} />
              Синхронизировать
            </button>
          </div>

          {/* Таблица продуктов */}
          <ProductList
            products={products}
            searchQuery={searchQuery}
            categoryId={activeCategory}
            availableColumns={availableColumns}
            onEdit={handleEdit}
          />

          {/* Кнопки сохранения */}
          <div className="save-buttons">
            <button
              onClick={saveToLocalStorage}
              className="save-btn local"
            >
              <Save className="btn-icon" /> Сохранить локально
            </button>
            <button
              onClick={saveToSupabase}
              disabled={loading}
              className="save-btn cloud"
            >
              <Upload className="btn-icon" /> Сохранить в БД
            </button>
            <button
              onClick={handleExport}
              className="save-btn export"
            >
              <Download className="btn-icon" /> Экспорт CSV
            </button>
          </div>
        </div>
      </main>

      {/* Модальные окна */}
      <NumberEditModal
        isOpen={editModal.isOpen}
        title={editModal.title}
        value={editModal.product?.[editModal.field]}
        onClose={() => setEditModal({ isOpen: false, product: null, field: '', title: '' })}
        onConfirm={handleConfirmEdit}
      />

      <AddModal
        isOpen={addModal.isOpen}
        type={addModal.type}
        categories={categories}
        onClose={() => setAddModal({ isOpen: false, type: 'product' })}
        onAdd={handleAddItem}
      />
    </div>
  )
}

export default MainApp
