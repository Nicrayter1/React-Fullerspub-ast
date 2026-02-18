/**
 * ============================================================
 * АДМИН-ПАНЕЛЬ
 * ============================================================
 * 
 * Главный компонент админ-панели для менеджера
 * Доступен только пользователю с ролью 'manager'
 * 
 * ФУНКЦИОНАЛ:
 * - Заморозка/разморозка продуктов
 * - Удаление продуктов
 * - Изменение порядка продуктов (drag & drop)
 * - Просмотр истории действий
 * - Фильтрация по категориям
 * - Поиск продуктов
 * - НОВОЕ: Система флагов и сценариев
 * 
 * @version 2.0.0
 * @author Admin Team
 * @date 2026-02-12
 * ============================================================
 */

import React, { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { useNavigate } from 'react-router-dom'
import supabaseAPI from '../api/supabase'
import {
  freezeProduct,
  unfreezeProduct,
  deleteProduct,
  updateProductsOrder
} from '../api/adminOperations'
import {
  runScenario,
  stopAllScenarios,
  getFlagsStatistics,
  updateProductFlags,
  SCENARIO_TYPES
} from '../api/scenarios'
import AdminProductList from './AdminProductList'
import Notification from './Notification'
import AddModal from './AddModal'
import FlagModal from './FlagModal'
import Button from './ui/Button'
import Input from './ui/Input'
import Select from './ui/Select'
import Card from './ui/Card'
import ParLevelManager from './ParLevelManager'

/**
 * ============================================================
 * ГЛАВНЫЙ КОМПОНЕНТ АДМИН-ПАНЕЛИ
 * ============================================================
 */
const AdminPanel = () => {
  // ============================================================
  // HOOKS И STATE
  // ============================================================
  
  const { userProfile } = useAuth()
  const navigate = useNavigate()

  // Данные из базы
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // UI состояния
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('products') // 'products' | 'orders'
  const [notification, setNotification] = useState(null)

  // Фильтры
  const [showFrozen, setShowFrozen] = useState(true)
  const [showActive, setShowActive] = useState(true)

  // Модальное окно добавления
  const [addModal, setAddModal] = useState({
    isOpen: false,
    type: 'product' // 'product' | 'category'
  })

  // ============================================================
  // НОВОЕ: STATE ДЛЯ СИСТЕМЫ ФЛАГОВ
  // ============================================================

  // Модальное окно флагов
  const [flagModal, setFlagModal] = useState({
    isOpen: false,
    product: null,
    flags: {
      red: false,
      green: false,
      yellow: false
    }
  })

  // Статистика флагов
  const [flagsStats, setFlagsStats] = useState(null)

  // Активный сценарий
  const [activeScenario, setActiveScenario] = useState(null)

  // ============================================================
  // ПРОВЕРКА ДОСТУПА
  // ============================================================
  
  useEffect(() => {
    // Проверяем, является ли пользователь менеджером
    if (userProfile && userProfile.role !== 'manager') {
      console.warn('⚠️ Попытка доступа к админ-панели не-менеджером')
      showNotification('Доступ запрещен', 'error')
      navigate('/') // Перенаправляем на главную страницу
    }
  }, [userProfile, navigate])

  // ============================================================
  // ЗАГРУЗКА ДАННЫХ
  // ============================================================
  
  /**
   * Загрузить категории и продукты из базы данных
   */
  const loadData = async () => {
    try {
      setLoading(true)
      console.log('📦 Загрузка данных для админ-панели...')

      // Параллельная загрузка категорий, продуктов и статистики
      const [categoriesData, productsData, statsResult] = await Promise.all([
        supabaseAPI.fetchCategories(),
        supabaseAPI.fetchProducts(),
        getFlagsStatistics()
      ])

      setCategories(categoriesData)
      setProducts(productsData)
      
      if (statsResult.success) {
        setFlagsStats(statsResult.stats)
      }
      
      console.log(`✅ Загружено: ${categoriesData.length} категорий, ${productsData.length} продуктов`)

    } catch (error) {
      console.error('❌ Ошибка загрузки данных:', error)
      showNotification('Ошибка загрузки данных', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // ============================================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
  // ============================================================
  
  /**
   * Показать уведомление пользователю
   */
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    // Автоматически скрываем через 3 секунды
    setTimeout(() => setNotification(null), 3000)
  }

  /**
   * Фильтрация продуктов по выбранной категории и поиску
   */
  const getFilteredProducts = () => {
    let filtered = products

    // Фильтр по категории
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category_id === selectedCategory.id)
    }

    // Фильтр по статусу (заморожен/активен)
    filtered = filtered.filter(p => {
      if (p.is_frozen && !showFrozen) return false
      if (!p.is_frozen && !showActive) return false
      return true
    })

    // Поиск по названию
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.volume.toLowerCase().includes(query)
      )
    }

    return filtered
  }

  // ============================================================
  // ОБРАБОТЧИКИ СОБЫТИЙ - ЗАМОРОЗКА/УДАЛЕНИЕ
  // ============================================================
  
  /**
   * Заморозить продукт
   */
  const handleFreezeProduct = async (productId) => {
    try {
      console.log(`❄️ Заморозка продукта ${productId}`)
      
      const result = await freezeProduct(
        productId,
        userProfile.email,
        {
          hideFromBar1: true,
          hideFromBar2: true
        }
      )

      if (result.success) {
        showNotification(result.message, 'success')
        // Обновляем локальное состояние
        setProducts(prev =>
          prev.map(p =>
            p.id === productId
              ? { ...p, is_frozen: true, visible_to_bar1: false, visible_to_bar2: false }
              : p
          )
        )
      } else {
        showNotification(result.error || 'Ошибка заморозки', 'error')
      }

    } catch (error) {
      console.error('❌ Ошибка заморозки:', error)
      showNotification('Ошибка заморозки продукта', 'error')
    }
  }

  /**
   * Разморозить продукт
   */
  const handleUnfreezeProduct = async (productId) => {
    try {
      console.log(`🔥 Разморозка продукта ${productId}`)
      
      const result = await unfreezeProduct(productId, userProfile.email)

      if (result.success) {
        showNotification(result.message, 'success')
        // Обновляем локальное состояние
        setProducts(prev =>
          prev.map(p =>
            p.id === productId
              ? { ...p, is_frozen: false, visible_to_bar1: true, visible_to_bar2: true }
              : p
          )
        )
      } else {
        showNotification(result.error || 'Ошибка разморозки', 'error')
      }

    } catch (error) {
      console.error('❌ Ошибка разморозки:', error)
      showNotification('Ошибка разморозки продукта', 'error')
    }
  }

  /**
   * Удалить продукт
   */
  const handleDeleteProduct = async (productId, productName) => {
    const confirmed = window.confirm(
      `Вы уверены, что хотите удалить "${productName}"?\n\nЭто действие нельзя отменить.`
    )

    if (!confirmed) return

    try {
      console.log(`🗑️ Удаление продукта ${productId}`)
      
      const result = await deleteProduct(productId, userProfile.email)

      if (result.success) {
        showNotification(`Продукт "${productName}" удален`, 'success')
        // Убираем из локального состояния
        setProducts(prev => prev.filter(p => p.id !== productId))
      } else {
        showNotification(result.error || 'Ошибка удаления', 'error')
      }

    } catch (error) {
      console.error('❌ Ошибка удаления:', error)
      showNotification('Ошибка удаления продукта', 'error')
    }
  }

  /**
   * Изменить порядок продуктов (drag & drop)
   */
  const handleReorderProducts = async (reorderedProducts) => {
    try {
      console.log('🔄 Изменение порядка продуктов')

      const result = await updateProductsOrder(reorderedProducts, userProfile.email)

      if (result.success) {
        setProducts(reorderedProducts)
        showNotification('Порядок продуктов обновлен', 'success')
      } else {
        showNotification('Ошибка изменения порядка', 'error')
      }

    } catch (error) {
      console.error('❌ Ошибка изменения порядка:', error)
      showNotification('Ошибка изменения порядка', 'error')
    }
  }

  /**
   * Добавить новый продукт или категорию
   */
  const handleAddItem = async ({ category, name, volume }) => {
    try {
      if (addModal.type === 'category') {
        // Добавление категории
        console.log('➕ Добавление категории:', name)
        
        const newCategory = await supabaseAPI.insertCategory({
          name: name,
          order_index: categories.length + 1
        })
        
        if (newCategory) {
          showNotification(`Категория "${name}" успешно добавлена!`, 'success')
          setCategories(prev => [...prev, newCategory])
          setAddModal({ isOpen: false, type: 'product' })
        } else {
          showNotification('Ошибка добавления категории', 'error')
        }
        
      } else {
        // Добавление продукта
        console.log('➕ Добавление продукта:', { category, name, volume })
        
        const newProduct = await supabaseAPI.insertProduct({
          category_id: category,
          name,
          volume,
          bar1: 0,
          bar2: 0,
          cold_room: 0,
          order_index: products.length + 1
        })
        
        if (newProduct) {
          showNotification(`Продукт "${name}" успешно добавлен!`, 'success')
          setProducts(prev => [...prev, newProduct])
          setAddModal({ isOpen: false, type: 'product' })
        } else {
          showNotification('Ошибка добавления продукта', 'error')
        }
      }
      
    } catch (error) {
      console.error('❌ Ошибка добавления:', error)
      showNotification('Ошибка добавления: ' + error.message, 'error')
    }
  }

  // ============================================================
  // НОВОЕ: ОБРАБОТЧИКИ ФЛАГОВ
  // ============================================================

  /**
   * Открыть модальное окно выбора флагов
   */
  const handleOpenFlagModal = (product) => {
    setFlagModal({
      isOpen: true,
      product: product,
      flags: {
        red: product.red_flag || false,
        green: product.green_flag || false,
        yellow: product.yellow_flag || false
      }
    })
  }

  /**
   * Сохранить флаги продукта
   */
  const handleSaveFlags = async () => {
    try {
      const result = await updateProductFlags(
        flagModal.product.id,
        flagModal.flags
      )
      
      if (result.success) {
        showNotification('Флаги сохранены', 'success')
        
        // Обновить продукт в списке
        setProducts(prev => prev.map(p => 
          p.id === flagModal.product.id
            ? {
                ...p,
                red_flag: flagModal.flags.red,
                green_flag: flagModal.flags.green,
                yellow_flag: flagModal.flags.yellow
              }
            : p
        ))
        
        // Закрыть модалку
        setFlagModal({ isOpen: false, product: null, flags: {} })
        
        // Обновить статистику
        const statsResult = await getFlagsStatistics()
        if (statsResult.success) {
          setFlagsStats(statsResult.stats)
        }
      } else {
        showNotification('Ошибка сохранения флагов', 'error')
      }
    } catch (error) {
      console.error('Ошибка:', error)
      showNotification('Ошибка сохранения флагов', 'error')
    }
  }

  // ============================================================
  // НОВОЕ: ОБРАБОТЧИКИ СЦЕНАРИЕВ
  // ============================================================

  /**
   * Запустить сценарий
   */
  const handleRunScenario = async (scenarioType) => {
    const scenario = Object.values(SCENARIO_TYPES).find(s => s.id === scenarioType)
    
    const confirmed = window.confirm(
      `Запустить сценарий "${scenario.name}"?\n\n` +
      `Это заморозит все позиции БЕЗ ${scenario.icon} флага.`
    )
    
    if (!confirmed) return
    
    setLoading(true)
    
    const result = await runScenario(
      scenarioType,
      userProfile.email
    )
    
    if (result.success) {
      showNotification(result.message, 'success')
      setActiveScenario(scenarioType)
      await loadData() // Перезагрузить продукты и статистику
    } else {
      showNotification('Ошибка запуска сценария: ' + result.error, 'error')
    }
    
    setLoading(false)
  }

  /**
   * Остановить все сценарии
   */
  const handleStopScenarios = async () => {
    const confirmed = window.confirm(
      'Остановить все сценарии?\n\n' +
      'Все продукты будут разморожены.'
    )
    
    if (!confirmed) return
    
    setLoading(true)
    
    const result = await stopAllScenarios()
    
    if (result.success) {
      showNotification(result.message, 'success')
      setActiveScenario(null)
      await loadData()
    } else {
      showNotification('Ошибка остановки сценариев: ' + result.error, 'error')
    }
    
    setLoading(false)
  }

  // ============================================================
  // ОТФИЛЬТРОВАННЫЕ ДАННЫЕ
  // ============================================================
  
  const filteredProducts = getFilteredProducts()

  // ============================================================
  // СОСТОЯНИЯ ЗАГРУЗКИ И ОШИБОК
  // ============================================================
  
  // Если роль не manager - показываем access denied
  if (userProfile && userProfile.role !== 'manager') {
    return (
      <div className="admin-panel-access-denied">
        <div className="access-denied-card">
          <h2>🚫 Доступ запрещен</h2>
          <p>Эта страница доступна только менеджерам.</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Вернуться на главную
          </button>
        </div>
      </div>
    )
  }

  // Показываем загрузку
  if (loading) {
    return (
      <div className="admin-panel-loading">
        <div className="spinner"></div>
        <p>Загрузка данных...</p>
      </div>
    )
  }

  // ============================================================
  // РЕНДЕР КОМПОНЕНТА
  // ============================================================
  
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors">
      {/* HEADER */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span>🎛️</span> Админ-панель
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Управление продуктами и сценариями
            </p>
          </div>
          <div>
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="bg-gray-100 dark:bg-gray-700"
            >
              ← Вернуться к приложению
            </Button>
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            className={`px-6 py-3 rounded-none border-b-2 shadow-none
              ${activeTab === 'products'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500'}`}
            onClick={() => setActiveTab('products')}
          >
            📦 Продукты
          </Button>
          <Button
            variant="ghost"
            className={`px-6 py-3 rounded-none border-b-2 shadow-none
              ${activeTab === 'orders'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500'}`}
            onClick={() => setActiveTab('orders')}
          >
            📋 Нормативы и заказ
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {activeTab === 'products' && (
          <div className="animate-slide-up">
            
            {/* НОВОЕ: СЕКЦИЯ СЦЕНАРИЕВ */}
            <Card title={
              <div className="flex items-center gap-2">
                <span>⚡</span> Сценарии
              </div>
            } className="mb-8">
              
              {/* Активный сценарий */}
              {activeScenario && (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4 animate-pulse">
                  <span className="text-2xl">
                    {Object.values(SCENARIO_TYPES).find(s => s.id === activeScenario)?.icon}
                  </span>
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-bold text-primary">
                      Активен: {Object.values(SCENARIO_TYPES).find(s => s.id === activeScenario)?.name}
                    </div>
                    <div className="text-sm text-primary/80">
                      Активных позиций: {
                        activeScenario === 'stocks' ? flagsStats?.red :
                        activeScenario === 'revision' ? flagsStats?.green :
                        flagsStats?.yellow
                      }
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="bg-white dark:bg-gray-700 text-primary dark:text-primary-dark"
                    onClick={handleStopScenarios}
                  >
                    ⏹️ Остановить
                  </Button>
                </div>
              )}
              
              {/* Кнопки запуска */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* СТОКИ */}
                <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-5 border border-gray-100 dark:border-gray-700 transition-colors">
                  <div className="flex items-start gap-4 mb-4">
                    <span className="text-3xl">🔴</span>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-gray-100">Стоки</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Еженедельный учет</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
                    {flagsStats?.red || 0} позиций
                  </div>
                  <Button
                    variant={activeScenario === 'stocks' ? 'ghost' : 'error'}
                    className={`w-full ${activeScenario === 'stocks' ? 'bg-red-100 text-red-600' : ''}`}
                    onClick={() => handleRunScenario('stocks')}
                    disabled={activeScenario === 'stocks'}
                  >
                    {activeScenario === 'stocks' ? '✓ Активен' : '▶ Запустить'}
                  </Button>
                </div>
                
                {/* РЕВИЗИЯ */}
                <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-5 border border-gray-100 dark:border-gray-700 transition-colors">
                  <div className="flex items-start gap-4 mb-4">
                    <span className="text-3xl">🟢</span>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-gray-100">Ревизия</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Полная инвентаризация</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
                    {flagsStats?.green || 0} позиций
                  </div>
                  <Button
                    variant={activeScenario === 'revision' ? 'ghost' : 'success'}
                    className={`w-full ${activeScenario === 'revision' ? 'bg-green-100 text-green-600' : ''}`}
                    onClick={() => handleRunScenario('revision')}
                    disabled={activeScenario === 'revision'}
                  >
                    {activeScenario === 'revision' ? '✓ Активен' : '▶ Запустить'}
                  </Button>
                </div>
                
                {/* ДОЛГАЯ ЗАМОРОЗКА */}
                <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-5 border border-gray-100 dark:border-gray-700 transition-colors">
                  <div className="flex items-start gap-4 mb-4">
                    <span className="text-3xl">🟡</span>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-gray-100">Долгая заморозка</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Архив/сезонные</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
                    {flagsStats?.yellow || 0} позиций
                  </div>
                  <Button
                    variant={activeScenario === 'long_freeze' ? 'ghost' : 'warning'}
                    className={`w-full ${activeScenario === 'long_freeze' ? 'bg-amber-100 text-amber-600' : ''}`}
                    onClick={() => handleRunScenario('long_freeze')}
                    disabled={activeScenario === 'long_freeze'}
                  >
                    {activeScenario === 'long_freeze' ? '✓ Активен' : '▶ Запустить'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* FILTERS AND SEARCH */}
            <div className="flex flex-wrap items-end gap-4 mb-8 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
              {/* Категории */}
              <Select
                label="Категория:"
                className="flex-1 min-w-[200px]"
                value={selectedCategory?.id || ''}
                onChange={(e) => {
                  const catId = e.target.value
                  setSelectedCategory(
                    catId ? categories.find(c => c.id === parseInt(catId)) : null
                  )
                }}
                options={[
                  { value: '', label: 'Все категории' },
                  ...categories.map(cat => ({ value: cat.id, label: cat.name }))
                ]}
              />

              {/* Поиск */}
              <Input
                label="Поиск:"
                className="flex-1 min-w-[200px]"
                placeholder="Название или объем..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {/* Фильтры статуса */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Показать:</label>
                <div className="flex items-center gap-4 bg-white dark:bg-gray-700 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg h-[38px]">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={showActive}
                      onChange={(e) => setShowActive(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary/20 border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">Активные</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={showFrozen}
                      onChange={(e) => setShowFrozen(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary/20 border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">Замороженные</span>
                  </label>
                </div>
              </div>

              {/* Кнопка обновления */}
              <div className="flex-shrink-0 mb-1.5">
                <Button
                  onClick={loadData}
                  variant="ghost"
                  className="h-[38px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                >
                  🔄 Обновить
                </Button>
              </div>

              {/* Кнопки добавления */}
              <div className="flex-shrink-0 mb-1.5">
                <Button
                  onClick={() => setAddModal({ isOpen: true, type: 'product' })}
                  variant="primary"
                  className="h-[38px]"
                >
                  ➕ Добавить продукт
                </Button>
              </div>

              <div className="flex-shrink-0 mb-1.5">
                <Button
                  onClick={() => setAddModal({ isOpen: true, type: 'category' })}
                  variant="secondary"
                  className="h-[38px] bg-gray-600 hover:bg-gray-700"
                >
                  ➕ Добавить категорию
                </Button>
              </div>
            </div>

            {/* PRODUCTS LIST */}
            <AdminProductList
              products={filteredProducts}
              categories={categories}
              onFreeze={handleFreezeProduct}
              onUnfreeze={handleUnfreezeProduct}
              onDelete={handleDeleteProduct}
              onReorder={handleReorderProducts}
              onOpenFlagModal={handleOpenFlagModal}
            />

            {/* EMPTY STATE */}
            {filteredProducts.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700 transition-colors">
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">🔍 Продукты не найдены</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Попробуйте изменить фильтры или поисковый запрос
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="animate-slide-up">
            <ParLevelManager />
          </div>
        )}
      </div>

      {/* NOTIFICATION */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* ADD MODAL */}
      <AddModal
        isOpen={addModal.isOpen}
        type={addModal.type}
        categories={categories}
        onClose={() => setAddModal({ isOpen: false, type: 'product' })}
        onAdd={handleAddItem}
      />

      {/* НОВОЕ: FLAG MODAL */}
      <FlagModal
        isOpen={flagModal.isOpen}
        product={flagModal.product}
        flags={flagModal.flags}
        onFlagsChange={(newFlags) => setFlagModal(prev => ({ ...prev, flags: newFlags }))}
        onSave={handleSaveFlags}
        onClose={() => setFlagModal({ isOpen: false, product: null, flags: {} })}
      />
    </div>
  )
}

export default AdminPanel
