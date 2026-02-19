/**
 * Главный компонент приложения после авторизации
 * Управляет состоянием и координирует работу всех компонентов
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Save, Upload, Download, RefreshCw, LogOut, User, Settings } from 'lucide-react'
import { useAuth } from './AuthContext'
import { useNavigate } from 'react-router-dom'

// Импорт компонентов
import Notification from './components/Notification'
import SearchInput from './components/SearchInput'
import NumberEditModal from './components/NumberEditModal'
import ProductList from './ProductList'
import Button from './components/ui/Button'
import AddModal from './components/AddModal'
import Card from './components/ui/Card'

// Импорт утилит
import { parseNumber } from './utils/format'
import { exportToCSV } from './utils/export'

// Импорт API
import supabaseAPI from './api/supabase'

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
    type: 'product' // 'product' | 'category'
  })

  // Доступные колонки для текущего пользователя
  const availableColumns = getAvailableColumns()

  // === АВТО-СИНХРОНИЗАЦИЯ LOCALSTORAGE ===
  useEffect(() => {
    if (categories.length > 0 || products.length > 0) {
      localStorage.setItem('barStockData', JSON.stringify({ categories, products }))
    }
  }, [categories, products])

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
        const cats = data.categories || []
        const prods = data.products || []
        setCategories(cats)
        setProducts(prods)
        return { categories: cats, products: prods }
      }
    } catch (error) {
      console.error('Ошибка загрузки из localStorage:', error)
    }
    return null
  }, [])

  /**
   * Сохранение в localStorage
   * 
   */
  const saveToLocalStorage = useCallback((showNotif = false) => {
  try {
    localStorage.setItem('barStockData', JSON.stringify({ categories, products }))
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
      const enrichedProducts = prods.map(product => {
        const cat = cats.find(c => c.id === product.category_id)
        return {
          ...product,
          category_name:        cat?.name       || 'Без категории',
          category_order_index: cat?.order_index ?? 99999
        }
      })
      
      // ============================================================
      // ОБНОВЛЕНИЕ СОСТОЯНИЯ
      // ============================================================
      setCategories(cats)
      setProducts(enrichedProducts)

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
  if (!availableColumns || availableColumns.length === 0) {
    showNotification('Ошибка: не определены доступные колонки', 'error')
    return
  }

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
    const result = await supabaseAPI.syncAll(products, availableColumns)
    
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
      
    } else if (result.updated > 0) {
      // ============================================================
      // ЧАСТИЧНЫЙ УСПЕХ - Часть продуктов сохранена
      // ============================================================
      showNotification(
        `⚠️ Частично сохранено в БД: ${result.updated} из ${result.total} продуктов. ${result.failed} ошибок.`,
        'warning'
      )
      
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
}, [products, availableColumns, showNotification])

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
      const localData = loadFromLocalStorage()
      const hasData = localData && localData.products.length > 0
      
      if (!hasData) {
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
    <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors">
      {/* Шапка с информацией о пользователе */}
      <header className="bg-slate-900 dark:bg-gray-950 text-white p-4 shadow-lg sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <h1 className="text-xl font-bold">Учет стоков бара</h1>

          <div className="flex items-center gap-3 md:gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-white/10 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              <User className="w-5 h-5 text-gray-300" />
              <div className="flex flex-col">
                <span className="text-xs md:text-sm font-medium leading-tight">{user?.email}</span>
                <span className="text-[10px] md:text-xs text-gray-400 leading-tight">{getRoleDisplayName(userProfile?.role)}</span>
              </div>
            </div>
            {userProfile?.role === 'manager' && (
              <Button
                onClick={() => navigate('/admin')}
                variant="primary"
                size="sm"
                className="bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-200 shadow-none"
                icon={Settings}
              >
                <span className="hidden sm:inline">Админ-панель</span>
              </Button>
            )}
            <Button
              onClick={handleSignOut}
              variant="danger"
              size="sm"
              icon={LogOut}
            >
              <span className="hidden sm:inline">Выйти</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="p-4 md:p-6">
        <Card className="max-w-7xl mx-auto">
          {/* Уведомления */}
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification({ message: '', type: 'info' })}
          />

          {/* Поиск */}
          <SearchInput value={searchQuery} onChange={setSearchQuery} />

          {/* Навигация по категориям */}
          <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
            <Button
              variant={activeCategory === null ? 'primary' : 'ghost'}
              size="sm"
              className={`rounded-full whitespace-nowrap ${activeCategory !== null ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              onClick={() => setActiveCategory(null)}
            >
              Все
            </Button>
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? 'primary' : 'ghost'}
                size="sm"
                className={`rounded-full whitespace-nowrap ${activeCategory !== cat.id ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>

          {/* Кнопки действий */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              onClick={syncWithSupabase}
              loading={loading}
              variant="info"
              className="flex-1 min-w-[140px]"
              icon={RefreshCw}
            >
              Синхронизировать
            </Button>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-8">
            <Button
              onClick={() => saveToLocalStorage(true)}
              variant="secondary"
              className="bg-blue-600 hover:bg-blue-700"
              icon={Save}
            >
              Сохранить локально
            </Button>
            <Button
              onClick={saveToSupabase}
              loading={loading}
              variant="primary"
              icon={Upload}
            >
              Сохранить в БД
            </Button>
            <Button
              onClick={handleExport}
              variant="ghost"
              className="bg-gray-600 hover:bg-gray-700 text-white"
              icon={Download}
            >
              Экспорт CSV
            </Button>
          </div>
        </Card>
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
