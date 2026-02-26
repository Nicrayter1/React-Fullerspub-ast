import { useState, useEffect, useCallback } from 'react'
import supabaseAPI from '../api/supabase'
import { parseNumber } from '../utils/format'
import { log, error, isDev } from '../utils/logger'

const FALLBACK_ORDER_INDEX = 99999
const LS_KEY = 'barStockData'

function readLocalStorage() {
  try {
    const saved = localStorage.getItem(LS_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      return {
        categories: data.categories || [],
        products: data.products || []
      }
    }
  } catch (err) {
    error('Ошибка чтения localStorage:', err)
  }
  return null
}

export function useStockData({ showNotification, availableColumns }) {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)

  // Автоматически пишем в localStorage при каждом изменении данных (offline-кеш)
  useEffect(() => {
    if (categories.length > 0 || products.length > 0) {
      localStorage.setItem(LS_KEY, JSON.stringify({ categories, products }))
    }
  }, [categories, products])

  // === ЗАГРУЗКА ===

  const loadFromSupabase = useCallback(async () => {
    try {
      setLoading(true)
      showNotification('Загрузка данных из базы...', 'info')
      log('📦 Загрузка данных из Supabase...')

      const cats = await supabaseAPI.fetchCategories()
      const prods = await supabaseAPI.fetchProducts()

      const enrichedProducts = prods.map(product => {
        const cat = cats.find(c => c.id === product.category_id)
        return {
          ...product,
          category_name:        cat?.name       || 'Без категории',
          category_order_index: cat?.order_index ?? FALLBACK_ORDER_INDEX
        }
      })

      setCategories(cats)
      setProducts(enrichedProducts)
      log('✅ Данные загружены из Supabase')
      showNotification(
        `✅ Загружено: ${cats.length} категорий, ${prods.length} продуктов`,
        'success'
      )
    } catch (err) {
      error('❌ Ошибка загрузки из Supabase:', err)

      // Пробуем offline-кеш
      const local = readLocalStorage()
      if (local && local.products.length > 0) {
        setCategories(local.categories)
        setProducts(local.products)
        showNotification(
          '⚠️ Работаете офлайн — данные могут быть устаревшими',
          'warning'
        )
      } else {
        let msg = 'Ошибка загрузки из БД'
        if (err.message?.includes('fetch') || err.message?.includes('network')) {
          msg += ': Проблема с подключением'
        } else {
          msg += `: ${err.message}`
        }
        showNotification(msg, 'error')
      }
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  // === СОХРАНЕНИЕ ===

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
      setLoading(true)
      showNotification(`Сохранение ${products.length} продуктов в базу...`, 'info')
      log(`💾 Начало сохранения ${products.length} продуктов...`)

      const result = await supabaseAPI.syncAll(products, availableColumns)
      log('✅ Результат сохранения:', result)

      if (result.success && result.updated === result.total) {
        showNotification(`✅ Данные сохранены в БД! Обновлено ${result.updated} продуктов`, 'success')
      } else if (result.updated > 0) {
        showNotification(
          `⚠️ Частично сохранено: ${result.updated} из ${result.total}. ${result.failed} ошибок.`,
          'warning'
        )
        if (isDev && result.errors?.length > 0) {
          console.group('📋 Детали ошибок сохранения:')
          result.errors.forEach((e, i) => error(`${i + 1}.`, e))
          console.groupEnd()
        }
      } else {
        const msg = result.userMessage || `Не удалось сохранить данные. ${result.failed} ошибок.`
        showNotification(msg, 'error')
        if (isDev && result.errors?.length > 0) {
          console.group('📋 Детали ошибок сохранения:')
          result.errors.forEach((e, i) => error(`${i + 1}.`, e))
          console.groupEnd()
        }
      }
    } catch (err) {
      error('❌ Критическая ошибка сохранения:', err)
      let msg = 'Ошибка сохранения: '
      if (err.message?.includes('fetch') || err.message?.includes('network')) {
        msg += 'Проблема с подключением к серверу.'
      } else {
        msg += err.message || 'Неизвестная ошибка'
      }
      showNotification(msg, 'error')
    } finally {
      setLoading(false)
    }
  }, [products, availableColumns, showNotification])

  // === ДОБАВЛЕНИЕ ===

  const handleAddItem = useCallback(async ({ category, name, volume }, addModalType) => {
    const categoryObj = categories.find(c => c.id === category)

    if (addModalType === 'category') {
      const exists = categories.some(c => c.name.toLowerCase() === name.toLowerCase())
      if (exists) {
        showNotification('Такая категория уже существует', 'error')
        return false
      }
      try {
        setLoading(true)
        showNotification('Создание категории...', 'info')
        const newCategory = await supabaseAPI.insertCategory({ name })
        setCategories(prev => [...prev, newCategory])
        showNotification(`Категория "${name}" добавлена`, 'success')
        return true
      } catch (err) {
        error('❌ Ошибка добавления категории:', err)
        showNotification(`Ошибка: ${err.message}`, 'error')
        return false
      } finally {
        setLoading(false)
      }
    } else {
      if (!categoryObj) {
        showNotification('Категория не найдена', 'error')
        return false
      }
      try {
        setLoading(true)
        showNotification('Создание продукта...', 'info')
        const newProduct = await supabaseAPI.insertProduct({
          category_id: categoryObj.id,
          name,
          volume,
          bar1: 0,
          bar2: 0,
          cold_room: 0
        })
        setProducts(prev => [...prev, {
          ...newProduct,
          category_name: categoryObj.name,
          category_order_index: categoryObj.order_index ?? FALLBACK_ORDER_INDEX
        }])
        showNotification(`Продукт "${name}" добавлен`, 'success')
        return true
      } catch (err) {
        error('❌ Ошибка добавления продукта:', err)
        showNotification(`Ошибка: ${err.message}`, 'error')
        return false
      } finally {
        setLoading(false)
      }
    }
  }, [categories, showNotification])

  // === РЕДАКТИРОВАНИЕ ===

  const handleConfirmEdit = useCallback((productId, field, value) => {
    const numValue = parseNumber(value)
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, [field]: numValue } : p
    ))
  }, [])

  return {
    categories,
    products,
    loading,
    loadFromSupabase,
    saveToSupabase,
    handleAddItem,
    handleConfirmEdit
  }
}
