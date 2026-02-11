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
 * 
 * @version 1.0.0
 * @author Admin Team
 * @date 2026-02-05
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
import AdminProductList from './AdminProductList'
import AdminHistoryView from './AdminHistoryView'
import Notification from './Notification'
import AddModal from './AddModal'
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

      // Параллельная загрузка категорий и продуктов
      const [categoriesData, productsData] = await Promise.all([
        supabaseAPI.fetchCategories(),
        supabaseAPI.fetchProducts()
      ])

      setCategories(categoriesData)
      setProducts(productsData)
      
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
  // ОБРАБОТЧИКИ СОБЫТИЙ
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

  /**
   * Удалить продукт
   */
  const handleDeleteProduct = async (productId, productName) => {
    // Подтверждение удаления
    const confirmed = window.confirm(
      `Вы уверены, что хотите удалить продукт "${productName}"?\n\nЭто действие необратимо!`
    )

    if (!confirmed) {
      return
    }

    try {
      console.log(`🗑️ Удаление продукта ${productId}`)
      
      const result = await deleteProduct(productId, userProfile.email)

      if (result.success) {
        showNotification(result.message, 'success')
        // Удаляем из локального состояния
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
      console.log(`🔄 Изменение порядка ${reorderedProducts.length} продуктов`)

      // Подготавливаем данные для обновления
      const updates = reorderedProducts.map((product, index) => ({
        id: product.id,
        order_index: index + 1
      }))

      const result = await updateProductsOrder(
        updates,
        userProfile.email,
        selectedCategory?.id
      )

      if (result.success) {
        showNotification('Порядок продуктов обновлен', 'success')
        // Обновляем локальное состояние
        setProducts(prev => {
          const updated = [...prev]
          reorderedProducts.forEach((product, index) => {
            const idx = updated.findIndex(p => p.id === product.id)
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], order_index: index + 1 }
            }
          })
          return updated
        })
      } else {
        showNotification(result.message || 'Ошибка обновления порядка', 'warning')
      }

    } catch (error) {
      console.error('❌ Ошибка изменения порядка:', error)
      showNotification('Ошибка изменения порядка', 'error')
    }
  }

  // ============================================================
  // RENDER
  // ============================================================
  
  // Проверка доступа
  if (!userProfile || userProfile.role !== 'manager') {
    return (
      <div className="admin-panel-access-denied">
        <div className="access-denied-card">
          <h2>🔒 Доступ запрещен</h2>
          <p>Эта страница доступна только для менеджеров</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Вернуться на главную
          </button>
        </div>
      </div>
    )
  }

  // Экран загрузки
  if (loading) {
    return (
      <div className="admin-panel-loading">
        <div className="spinner"></div>
        <p>Загрузка данных...</p>
      </div>
    )
  }

  const filteredProducts = getFilteredProducts()

  return (
    <div className="admin-panel">
      {/* HEADER */}
      <header className="admin-panel-header">
        <div className="header-content">
          <div className="header-left">
            <h1>⚙️ Админ-панель</h1>
            <p className="header-subtitle">Управление продуктами</p>
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
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📜 История
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="admin-panel-content">
        {activeTab === 'products' && (
          <div className="products-view">
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

        {activeTab === 'history' && (
          <AdminHistoryView />
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
    </div>
  )
}

export default AdminPanel
