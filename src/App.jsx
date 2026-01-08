/**
 * Главный компонент приложения
 * Управляет состоянием и координирует работу всех компонентов
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Save, Upload, Download, RefreshCw } from 'lucide-react'

// Импорт компонентов
import Notification from './components/Notification'
import SearchInput from './components/SearchInput'
import StockTable from './components/StockTable'
import NumberEditModal from './components/NumberEditModal'
import AddModal from './components/AddModal'

// Импорт утилит
import { parseNumber } from './utils/format'
import { exportToCSV } from './utils/export'

// Импорт API
import supabaseAPI from './api/supabase'

import './App.css'

function App() {
  // === STATE MANAGEMENT ===
  
  // Данные
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  
  // UI состояние
  const [searchQuery, setSearchQuery] = useState('')
  const [notification, setNotification] = useState({ message: '', type: 'info' })
  const [loading, setLoading] = useState(false)
  
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

  // === УВЕДОМЛЕНИЯ ===
  
  /**
   * Показ уведомления пользователю
   */
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type })
  }, [])

  // === РАБОТА С LOCALSTORAGE ===
  
  /**
   * Загрузка данных из localStorage
   */
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
   * Сохранение данных в localStorage
   */
  const saveToLocalStorage = useCallback(() => {
    try {
      localStorage.setItem('barStockData', JSON.stringify({ categories, products }))
      showNotification('Данные успешно сохранены локально!', 'success')
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
      
      showNotification('Данные успешно загружены!', 'success')
    } catch (error) {
      console.error('Ошибка загрузки из Supabase:', error)
      showNotification('Ошибка загрузки из БД. Используем локальные данные', 'error')
      loadFromLocalStorage()
    } finally {
      setLoading(false)
    }
  }, [showNotification, loadFromLocalStorage])

  /**
   * Сохранение данных в Supabase
   */
  const saveToSupabase = useCallback(async () => {
    try {
      setLoading(true)
      showNotification('Сохранение в базу данных...', 'info')
      await supabaseAPI.syncAll(products)
      showNotification('Данные успешно сохранены в БД!', 'success')
    } catch (error) {
      console.error('Ошибка сохранения в Supabase:', error)
      showNotification('Ошибка сохранения: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [products, showNotification])

  /**
   * Синхронизация с Supabase (с подтверждением)
   */
  const syncWithSupabase = useCallback(async () => {
    if (window.confirm('Загрузить данные из базы? Текущие изменения будут потеряны.')) {
      await loadFromSupabase()
    }
  }, [loadFromSupabase])

  // === ИНИЦИАЛИЗАЦИЯ ===
  
  useEffect(() => {
    const init = async () => {
      // Пробуем загрузить из localStorage
      if (!loadFromLocalStorage() || products.length === 0) {
        // Если нет локальных данных, загружаем из Supabase
        if (supabaseAPI.client) {
          await loadFromSupabase()
        } else {
          showNotification('Настройте подключение к Supabase', 'info')
        }
      }
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // === ОБРАБОТЧИКИ ДЕЙСТВИЙ ===
  
  /**
   * Открытие модалки редактирования числа
   */
  const handleEdit = (product, field) => {
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

  /**
   * Подтверждение редактирования числа
   */
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
   * Добавление нового элемента (категория или продукт)
   */
  const handleAddItem = ({ category, name, volume }) => {
    const categoryObj = categories.find(c => 
      c.name.toLowerCase() === category.toLowerCase()
    )

    if (addModal.type === 'category') {
      // Добавление категории
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
      // Добавление продукта
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

  /**
   * Экспорт данных в CSV
   */
  const handleExport = () => {
    exportToCSV(products)
    showNotification('CSV файл скачивается...', 'success')
  }

  // === RENDER ===
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black p-2">
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-900 rounded-xl p-3 shadow-sm">
        {/* Заголовок */}
        <h1 className="text-xl font-semibold text-center mb-3 dark:text-white">
          📊 Учет стоков бара
        </h1>

        {/* Уведомления */}
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ message: '', type: 'info' })}
        />

        {/* Поиск */}
        <SearchInput value={searchQuery} onChange={setSearchQuery} />

        {/* Кнопки действий */}
        <div className="flex flex-wrap gap-2 my-3">
          <button
            onClick={() => setAddModal({ isOpen: true, type: 'product' })}
            className="flex-1 min-w-[calc(50%-4px)] flex items-center justify-center gap-1.5 py-2.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition"
          >
            <Plus className="w-4 h-4" /> Добавить продукт
          </button>
          <button
            onClick={() => setAddModal({ isOpen: true, type: 'category' })}
            className="flex-1 min-w-[calc(50%-4px)] flex items-center justify-center gap-1.5 py-2.5 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition"
          >
            <Plus className="w-4 h-4" /> Добавить категорию
          </button>
          <button
            onClick={syncWithSupabase}
            disabled={loading}
            className="flex-1 min-w-[calc(50%-4px)] flex items-center justify-center gap-1.5 py-2.5 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600 disabled:opacity-50 transition"
          >
            <RefreshCw className="w-4 h-4" /> Синхронизировать
          </button>
        </div>

        {/* Таблица */}
        <StockTable
          products={products}
          searchQuery={searchQuery}
          onEdit={handleEdit}
        />

        {/* Кнопки сохранения */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={saveToLocalStorage}
            className="flex-1 min-w-[calc(50%-4px)] flex items-center justify-center gap-1.5 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition"
          >
            <Save className="w-4 h-4" /> Сохранить локально
          </button>
          <button
            onClick={saveToSupabase}
            disabled={loading}
            className="flex-1 min-w-[calc(50%-4px)] flex items-center justify-center gap-1.5 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition"
          >
            <Upload className="w-4 h-4" /> Сохранить в БД
          </button>
          <button
            onClick={handleExport}
            className="flex-1 min-w-[calc(50%-4px)] flex items-center justify-center gap-1.5 py-2.5 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition"
          >
            <Download className="w-4 h-4" /> Экспорт CSV
          </button>
        </div>

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
    </div>
  )
}

export default App
