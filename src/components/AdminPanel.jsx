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
import './AdminPanel.css'

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
  const [activeTab, setActiveTab] = useState('products') // 'products' | 'history'
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
      
      const result = await deleteProduct(productId, productName, userProfile.email)

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
    <div className="admin-panel">
      {/* HEADER */}
      <header className="admin-panel-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🎛️ Админ-панель</h1>
            <p className="header-subtitle">
              Управление продуктами и сценариями
            </p>
          </div>
          <div className="header-right">
            <button
              onClick={() => navigate('/')}
              className="btn-secondary"
            >
              ← Вернуться к приложению
            </button>
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <div className="admin-panel-tabs">
        <button
          className={`tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          📦 Продукты
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="admin-panel-content">
        {activeTab === 'products' && (
          <div className="products-view">
            
            {/* НОВОЕ: СЕКЦИЯ СЦЕНАРИЕВ */}
            <div className="scenarios-section">
              <h3>⚡ Сценарии</h3>
              
              {/* Активный сценарий */}
              {activeScenario && (
                <div className="active-scenario-banner">
                  <span className="scenario-icon">
                    {Object.values(SCENARIO_TYPES).find(s => s.id === activeScenario)?.icon}
                  </span>
                  <div className="scenario-info">
                    <div className="scenario-name">
                      Активен: {Object.values(SCENARIO_TYPES).find(s => s.id === activeScenario)?.name}
                    </div>
                    <div className="scenario-stats">
                      Активных позиций: {
                        activeScenario === 'stocks' ? flagsStats?.red :
                        activeScenario === 'revision' ? flagsStats?.green :
                        flagsStats?.yellow
                      }
                    </div>
                  </div>
                  <button 
                    className="btn-stop-scenario"
                    onClick={handleStopScenarios}
                  >
                    ⏹️ Остановить
                  </button>
                </div>
              )}
              
              {/* Кнопки запуска */}
              <div className="scenarios-grid">
                {/* СТОКИ */}
                <div className="scenario-card">
                  <div className="scenario-header">
                    <span className="scenario-icon-large">🔴</span>
                    <div>
                      <div className="scenario-title">Стоки</div>
                      <div className="scenario-subtitle">Еженедельный учет</div>
                    </div>
                  </div>
                  <div className="scenario-count">
                    {flagsStats?.red || 0} позиций
                  </div>
                  <button
                    className="btn-run-scenario scenario-red"
                    onClick={() => handleRunScenario('stocks')}
                    disabled={activeScenario === 'stocks'}
                  >
                    {activeScenario === 'stocks' ? '✓ Активен' : '▶ Запустить'}
                  </button>
                </div>
                
                {/* РЕВИЗИЯ */}
                <div className="scenario-card">
                  <div className="scenario-header">
                    <span className="scenario-icon-large">🟢</span>
                    <div>
                      <div className="scenario-title">Ревизия</div>
                      <div className="scenario-subtitle">Полная инвентаризация</div>
                    </div>
                  </div>
                  <div className="scenario-count">
                    {flagsStats?.green || 0} позиций
                  </div>
                  <button
                    className="btn-run-scenario scenario-green"
                    onClick={() => handleRunScenario('revision')}
                    disabled={activeScenario === 'revision'}
                  >
                    {activeScenario === 'revision' ? '✓ Активен' : '▶ Запустить'}
                  </button>
                </div>
                
                {/* ДОЛГАЯ ЗАМОРОЗКА */}
                <div className="scenario-card">
                  <div className="scenario-header">
                    <span className="scenario-icon-large">🟡</span>
                    <div>
                      <div className="scenario-title">Долгая заморозка</div>
                      <div className="scenario-subtitle">Архив/сезонные</div>
                    </div>
                  </div>
                  <div className="scenario-count">
                    {flagsStats?.yellow || 0} позиций
                  </div>
                  <button
                    className="btn-run-scenario scenario-yellow"
                    onClick={() => handleRunScenario('long_freeze')}
                    disabled={activeScenario === 'long_freeze'}
                  >
                    {activeScenario === 'long_freeze' ? '✓ Активен' : '▶ Запустить'}
                  </button>
                </div>
              </div>
            </div>

            {/* FILTERS AND SEARCH */}
            <div className="admin-panel-controls">
              {/* Категории */}
              <div className="control-group">
                <label>Категория:</label>
                <select
                  value={selectedCategory?.id || ''}
                  onChange={(e) => {
                    const catId = e.target.value
                    setSelectedCategory(
                      catId ? categories.find(c => c.id === parseInt(catId)) : null
                    )
                  }}
                  className="select-category"
                >
                  <option value="">Все категории</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Поиск */}
              <div className="control-group">
                <label>Поиск:</label>
                <input
                  type="text"
                  placeholder="Название или объем..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              {/* Фильтры статуса */}
              <div className="control-group">
                <label>Показать:</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={showActive}
                      onChange={(e) => setShowActive(e.target.checked)}
                    />
                    <span>Активные</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={showFrozen}
                      onChange={(e) => setShowFrozen(e.target.checked)}
                    />
                    <span>Замороженные</span>
                  </label>
                </div>
              </div>

              {/* Кнопка обновления */}
              <div className="control-group">
                <button onClick={loadData} className="btn-refresh">
                  🔄 Обновить
                </button>
              </div>

              {/* Кнопки добавления */}
              <div className="control-group">
                <button
                  onClick={() => setAddModal({ isOpen: true, type: 'product' })}
                  className="btn-add-product"
                >
                  ➕ Добавить продукт
                </button>
              </div>

              <div className="control-group">
                <button
                  onClick={() => setAddModal({ isOpen: true, type: 'category' })}
                  className="btn-add-category"
                >
                  ➕ Добавить категорию
                </button>
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
              <div className="empty-state">
                <p>🔍 Продукты не найдены</p>
                <p className="empty-state-hint">
                  Попробуйте изменить фильтры или поисковый запрос
                </p>
              </div>
            )}
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
