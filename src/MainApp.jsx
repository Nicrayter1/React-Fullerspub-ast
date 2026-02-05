/**
 * Главный компонент приложения после авторизации
 * Управляет состоянием и координирует работу всех компонентов
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Save, Upload, Download, RefreshCw, LogOut, User, Settings } from 'lucide-react'
import { useAuth } from './AuthContext'
import { useNavigate } from 'react-router-dom'

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
  const navigate = useNavigate()

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

  /**
   * Сохранение в localStorage
   * @param {boolean} showNotif - Показывать ли уведомление (по умолчанию false)
   */
  const saveToLocalStorage = useCallback((showNotif = false) => {
    try {
      localStorage.setItem('barStockData', JSON.stringify({ categories, products }))
      
      // Показываем уведомление только если явно запрошено
      if (showNotif) {
        showNotification('✅ Данные сохранены локально!', 'success')
      }
      
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
  /**
   * ============================================================
   * УЛУЧШЕННАЯ ФУНКЦИЯ ЗАГРУЗКИ ИЗ SUPABASE
   * ============================================================
   * 
   * Версия: 3.0.0 - УЛУЧШЕНО
   * 
   * УЛУЧШЕНИЯ:
   * ✅ Показывает уведомление "Загрузка..." сразу
   * ✅ Показывает количество загруженных элементов
   * ✅ Понятные сообщения об ошибках
   * ============================================================
   */
  const loadFromSupabase = useCallback(async () => {
    try {
      // ============================================================
      // НАЧАЛО ЗАГРУЗКИ
      // ============================================================
      setLoading(true)
      
      // Показываем уведомление о начале загрузки
      showNotification('Загрузка данных из базы...', 'info')
      
      console.log('📦 Загрузка данных из Supabase...')
      
      // ============================================================
      // ЗАГРУЗКА КАТЕГОРИЙ
      // ============================================================
      console.log('📂 Загрузка категорий...')
      const cats = await supabaseAPI.fetchCategories()
      console.log(`✅ Загружено ${cats.length} категорий`)
      
      // ============================================================
      // ЗАГРУЗКА ПРОДУКТОВ
      // ============================================================
      console.log('📦 Загрузка продуктов...')
      const prods = await supabaseAPI.fetchProducts()
      console.log(`✅ Загружено ${prods.length} продуктов`)
      
      // ============================================================
      // ОБОГАЩЕНИЕ ДАННЫХ
      // ============================================================
      // Добавляем название категории к каждому продукту
      const enrichedProducts = prods.map(product => ({
        ...product,
        category_name: cats.find(c => c.id === product.category_id)?.name || 'Без категории'
      }))
      
      // ============================================================
      // ОБНОВЛЕНИЕ СОСТОЯНИЯ
      // ============================================================
      setCategories(cats)
      setProducts(enrichedProducts)

      // ============================================================
      // СОХРАНЕНИЕ В LOCALSTORAGE КАК BACKUP
      // ============================================================
      localStorage.setItem('barStockData', JSON.stringify({
        categories: cats,
        products: enrichedProducts
      }))

      // ============================================================
      // УСПЕШНОЕ ЗАВЕРШЕНИЕ
      // ============================================================
      console.log('✅ Данные загружены из Supabase')
      showNotification(
        `✅ Загружено: ${cats.length} категорий, ${prods.length} продуктов`,
        'success'
      )
      
    } catch (error) {
      // ============================================================
      // ОБРАБОТКА ОШИБОК
      // ============================================================
      console.error('❌ Ошибка загрузки из Supabase:', error)
      
      // Формируем понятное сообщение об ошибке
      let errorMessage = 'Ошибка загрузки из БД'
      
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        errorMessage += ': Проблема с подключением'
      } else if (error.message?.includes('не инициализирован')) {
        errorMessage += ': Не настроен Supabase'
      } else {
        errorMessage += `: ${error.message}`
      }
      
      showNotification(errorMessage + '. Используем локальные данные.', 'warning')
      
      // Пытаемся загрузить из localStorage
      loadFromLocalStorage()
      
    } finally {
      // ============================================================
      // ЗАВЕРШЕНИЕ
      // ============================================================
      setLoading(false)
    }
  }, [showNotification, loadFromLocalStorage])

 /**
 * ============================================================
 * УЛУЧШЕННАЯ ФУНКЦИЯ СОХРАНЕНИЯ В SUPABASE
 * ============================================================
 * 
 * Версия: 3.0.0 - УЛУЧШЕНО
 * 
 * УЛУЧШЕНИЯ:
 * ✅ Показывает уведомление "Сохранение..." сразу
 * ✅ Правильно обрабатывает result.updated вместо result.succeeded
 * ✅ Показывает warning при частичном успехе
 * ✅ Показывает error только при полном провале
 * ✅ Понятные сообщения для пользователя
 * 
 * Замените функцию saveToSupabase в MainApp.jsx (примерно строки 137-181)
 * ============================================================
 */

const saveToSupabase = useCallback(async () => {
  // ============================================================
  // ВАЛИДАЦИЯ - Проверка что есть данные
  // ============================================================
  if (!products || products.length === 0) {
    showNotification('Нет данных для сохранения', 'warning')
    return
  }

  try {
    // ============================================================
    // НАЧАЛО СОХРАНЕНИЯ
    // ============================================================
    setLoading(true)
    
    // Показываем уведомление о начале сохранения
    showNotification(`Сохранение ${products.length} продуктов в базу...`, 'info')
    
    console.log(`💾 Начало сохранения ${products.length} продуктов...`)
    
    // ============================================================
    // ВЫЗОВ API - Массовое обновление
    // ============================================================
    const result = await supabaseAPI.syncAll(products)
    
    console.log('✅ Результат сохранения:', result)
    
    // ============================================================
    // АНАЛИЗ РЕЗУЛЬТАТА И ПОКАЗ УВЕДОМЛЕНИЯ
    // ============================================================
    
    if (result.success && result.updated === result.total) {
      // ============================================================
      // ПОЛНЫЙ УСПЕХ - Все продукты сохранены
      // ============================================================
      showNotification(
        `✅ Данные сохранены в БД! Обновлено ${result.updated} продуктов`,
        'success'
      )
      
      // После успешного сохранения обновляем localStorage (тихо)
      saveToLocalStorage()
      
    } else if (result.updated > 0) {
      // ============================================================
      // ЧАСТИЧНЫЙ УСПЕХ - Часть продуктов сохранена
      // ============================================================
      showNotification(
        `⚠️ Частично сохранено в БД: ${result.updated} из ${result.total} продуктов. ${result.failed} ошибок.`,
        'warning'
      )
      
      // Даже при частичном успехе сохраняем в localStorage (тихо)
      saveToLocalStorage()
      
      // Логируем детали ошибок
      if (result.errors && result.errors.length > 0) {
        console.group('📋 Детали ошибок сохранения:')
        result.errors.forEach((error, index) => {
          console.error(`${index + 1}.`, error)
        })
        console.groupEnd()
      }
      
    } else {
      // ============================================================
      // ПОЛНЫЙ ПРОВАЛ - Ни один продукт не сохранен
      // ============================================================
      
      // Проверяем есть ли понятное сообщение от API
      const errorMsg = result.userMessage || 
                      `Не удалось сохранить данные. ${result.failed} ошибок.`
      
      showNotification(errorMsg, 'error')
      
      // Логируем детали ошибок
      if (result.errors && result.errors.length > 0) {
        console.group('📋 Детали ошибок сохранения:')
        result.errors.forEach((error, index) => {
          console.error(`${index + 1}.`, error)
        })
        console.groupEnd()
      }
    }
    
  } catch (error) {
    // ============================================================
    // КРИТИЧЕСКАЯ ОШИБКА
    // ============================================================
    console.error('❌ Критическая ошибка сохранения:', error)
    
    // Формируем понятное сообщение об ошибке
    let errorMessage = 'Ошибка сохранения: '
    
    if (error.message?.includes('не удалось обновить')) {
      errorMessage += error.message
    } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
      errorMessage += 'Проблема с подключением к серверу. Проверьте интернет.'
    } else if (error.message?.includes('cors')) {
      errorMessage += 'Ошибка доступа к серверу (CORS). Попробуйте еще раз.'
    } else {
      errorMessage += error.message || 'Неизвестная ошибка'
    }
    
    showNotification(errorMessage, 'error')
    
  } finally {
    // ============================================================
    // ЗАВЕРШЕНИЕ
    // ============================================================
    // КРИТИЧНО: Всегда сбрасываем loading, даже если была ошибка
    setLoading(false)
    console.log('🏁 Сохранение завершено, loading = false')
  }
}, [products, showNotification, saveToLocalStorage])

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

  /**
   * ============================================================
   * ОБРАБОТЧИК ДОБАВЛЕНИЯ ПРОДУКТА ИЛИ КАТЕГОРИИ
   * ============================================================
   * 
   * ВЕРСИЯ v2.2.0 - ИСПРАВЛЕНО
   * 
   * ИСПРАВЛЕНИЯ:
   * ✅ Использует INSERT запросы к Supabase вместо Date.now()
   * ✅ PostgreSQL автоматически генерирует правильный ID
   * ✅ Решена проблема "value out of range for type integer"
   * ✅ Асинхронная функция с обработкой ошибок
   * ✅ Показывает loading индикатор во время создания
   * ✅ Автоматически сохраняет в localStorage
   * 
   * ПРОЦЕСС:
   * 1. Проверка существования категории (для категорий)
   * 2. Вызов insertCategory() или insertProduct() через API
   * 3. PostgreSQL создает запись и возвращает её с ID
   * 4. Добавление в локальное состояние
   * 5. Сохранение в localStorage
   * 6. Показ уведомления пользователю
   * 
   * @param {Object} params - Параметры добавления
   * @param {string} params.category - Название категории
   * @param {string} params.name - Название продукта (для продуктов)
   * @param {string} params.volume - Объем продукта (для продуктов)
   */
  const handleAddItem = async ({ category, name, volume }) => {
    // ============================================================
    // ПОИСК КАТЕГОРИИ
    // ============================================================
    // Ищем объект категории по названию (case-insensitive)
    const categoryObj = categories.find(c =>
      c.name.toLowerCase() === category.toLowerCase()
    )

    // ============================================================
    // ДОБАВЛЕНИЕ КАТЕГОРИИ
    // ============================================================
    if (addModal.type === 'category') {
      // Проверяем не существует ли уже такая категория
      const exists = categories.some(c =>
        c.name.toLowerCase() === category.toLowerCase()
      )
      
      if (!exists) {
        try {
          // Показываем индикатор загрузки
          setLoading(true)
          showNotification('Создание категории...', 'info')
          
          // ============================================================
          // ВСТАВКА КАТЕГОРИИ В БД
          // ============================================================
          // Вызываем метод insertCategory из supabaseAPI
          // PostgreSQL автоматически сгенерирует ID через SERIAL
          const newCategory = await supabaseAPI.insertCategory({
            name: category,
            order_index: categories.length + 1
          })
          
          // ============================================================
          // ОБНОВЛЕНИЕ ЛОКАЛЬНОГО СОСТОЯНИЯ
          // ============================================================
          // Добавляем новую категорию в массив categories
          setCategories(prev => [...prev, newCategory])
          
          // ============================================================
          // СОХРАНЕНИЕ В LOCALSTORAGE
          // ============================================================
          // Обновляем localStorage чтобы данные сохранились
          const updatedCategories = [...categories, newCategory]
          localStorage.setItem('barStockData', JSON.stringify({
            categories: updatedCategories,
            products
          }))
          
          // Показываем успешное уведомление
          showNotification(`Категория "${category}" добавлена`, 'success')
          
        } catch (error) {
          // ============================================================
          // ОБРАБОТКА ОШИБОК
          // ============================================================
          console.error('❌ Ошибка добавления категории:', error)
          showNotification(`Ошибка: ${error.message}`, 'error')
        } finally {
          // Всегда убираем индикатор загрузки
          setLoading(false)
        }
      } else {
        // Категория уже существует
        showNotification('Такая категория уже существует', 'error')
      }
    
    // ============================================================
    // ДОБАВЛЕНИЕ ПРОДУКТА
    // ============================================================
    } else {
      // Проверяем что категория найдена
      if (!categoryObj) {
        showNotification('Категория не найдена', 'error')
        return
      }
      
      try {
        // Показываем индикатор загрузки
        setLoading(true)
        showNotification('Создание продукта...', 'info')
        
        // ============================================================
        // ВСТАВКА ПРОДУКТА В БД
        // ============================================================
        // Вызываем метод insertProduct из supabaseAPI
        // PostgreSQL автоматически сгенерирует ID через SERIAL
        // Это решает проблему с Date.now() (слишком большой ID)
        const newProduct = await supabaseAPI.insertProduct({
          category_id: categoryObj.id,
          name,
          volume,
          bar1: 0,
          bar2: 0,
          cold_room: 0,
          order_index: products.length + 1
        })
        
        // ============================================================
        // ОБОГАЩЕНИЕ ДАННЫХ
        // ============================================================
        // Добавляем название категории для удобства отображения
        const enrichedProduct = {
          ...newProduct,
          category_name: category
        }
        
        // ============================================================
        // ОБНОВЛЕНИЕ ЛОКАЛЬНОГО СОСТОЯНИЯ
        // ============================================================
        // Добавляем новый продукт в массив products
        setProducts(prev => [...prev, enrichedProduct])
        
        // ============================================================
        // СОХРАНЕНИЕ В LOCALSTORAGE
        // ============================================================
        // Обновляем localStorage чтобы данные сохранились
        const updatedProducts = [...products, enrichedProduct]
        localStorage.setItem('barStockData', JSON.stringify({
          categories,
          products: updatedProducts
        }))
        
        // Показываем успешное уведомление
        showNotification(`Продукт "${name}" добавлен`, 'success')
        
      } catch (error) {
        // ============================================================
        // ОБРАБОТКА ОШИБОК
        // ============================================================
        console.error('❌ Ошибка добавления продукта:', error)
        showNotification(`Ошибка: ${error.message}`, 'error')
      } finally {
        // Всегда убираем индикатор загрузки
        setLoading(false)
      }
    }
    
    // ============================================================
    // ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА
    // ============================================================
    // Закрываем модальное окно после завершения операции
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
            {userProfile?.role === 'manager' && (
              <button onClick={() => navigate('/admin')} className="admin-button">
                <Settings className="admin-icon" />
                <span>Админ-панель</span>
              </button>
            )}
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
              onClick={() => saveToLocalStorage(true)}
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
