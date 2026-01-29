/**
 * API слой для работы с Supabase
 * Изолирует всю логику работы с базой данных
 * 
 * ИСПРАВЛЕНО:
 * - syncAll() теперь использует batch update вместо цикла
 * - Добавлена детальная обработка ошибок
 * - Добавлены retry механизмы для надежности
 */

import { createClient } from '@supabase/supabase-js'

// Конфигурация Supabase из переменных окружения
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Проверка наличия переменных окружения
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Ошибка: Необходимо настроить переменные окружения VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY')
}

/**
 * Клиент Supabase с настройками аутентификации
 */
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,      // Сохраняет сессию в localStorage
    autoRefreshToken: true,    // Автоматически продлевает токен
    detectSessionInUrl: true   // Обнаруживает сессию из URL (для OAuth)
  }
})

/**
 * Вспомогательная функция для задержки (для retry)
 * @param {number} ms - Миллисекунды задержки
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Класс для работы с Supabase API
 */
class SupabaseAPI {
  constructor() {
    this.client = supabaseClient
  }

  /**
   * Загрузка всех категорий из БД
   * @returns {Promise<Array>} Массив категорий
   */
  async fetchCategories() {
    if (!this.client) throw new Error('Supabase не инициализирован')

    console.log('📦 Загрузка категорий...')
    
    const { data, error } = await this.client
      .from('categories')
      .select('*')
      .order('order_index')

    if (error) {
      console.error('❌ Ошибка загрузки категорий:', error)
      throw error
    }
    
    console.log(`✅ Загружено ${data.length} категорий`)
    return data
  }

  /**
   * Загрузка всех продуктов из БД
   * 
   * ВАЖНО: Сортируется по order_index для правильного порядка отображения
   * Fallback на ID происходит на уровне ProductList.jsx
   * 
   * @returns {Promise<Array>} Массив продуктов, отсортированных по order_index
   */
  async fetchProducts() {
    if (!this.client) throw new Error('Supabase не инициализирован')

    console.log('📦 Загрузка продуктов...')
    
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .order('order_index', { nullsLast: true })  // ← ИСПРАВЛЕНО: сортировка по order_index

    if (error) {
      console.error('❌ Ошибка загрузки продуктов:', error)
      throw error
    }
    
    console.log(`✅ Загружено ${data.length} продуктов (отсортировано по order_index)`)
    return data
  }

  /**
   * Обновление остатков продукта в БД
   * @param {number} productId - ID продукта
   * @param {Object} updates - Объект с обновлениями (bar1, bar2, cold_room)
   * @param {number} retryCount - Количество попыток (для retry логики)
   */
  async updateProductStock(productId, updates, retryCount = 0) {
    if (!this.client) throw new Error('Supabase не инициализирован')

    try {
      const { error } = await this.client
        .from('products')
        .update(updates)
        .eq('id', productId)

      if (error) throw error
      
      return { success: true, productId }
      
    } catch (error) {
      // Если это сетевая ошибка и у нас есть попытки - повторяем
      if (retryCount < 2 && (error.message.includes('fetch') || error.message.includes('network'))) {
        console.warn(`⚠️ Повтор обновления продукта ${productId}, попытка ${retryCount + 1}`)
        await delay(1000 * (retryCount + 1)) // Увеличивающаяся задержка
        return this.updateProductStock(productId, updates, retryCount + 1)
      }
      
      console.error(`❌ Ошибка обновления продукта ${productId}:`, error)
      return { success: false, productId, error: error.message }
    }
  }

  /**
   * ИСПРАВЛЕНО: Синхронизация всех продуктов с БД
   * Теперь обновляет продукты ПАРАЛЛЕЛЬНО пачками по 10 штук
   * Это намного быстрее чем в цикле!
   * 
   * @param {Array} products - Массив продуктов для синхронизации
   * @returns {Promise<Object>} Результат синхронизации с деталями
   */
  async syncAll(products) {
    if (!this.client) throw new Error('Supabase не инициализирован')
    if (!products || products.length === 0) {
      return { success: true, total: 0, succeeded: 0, failed: 0 }
    }

    console.log(`🔄 Начало синхронизации ${products.length} продуктов...`)
    
    const BATCH_SIZE = 10 // Обновляем по 10 продуктов одновременно
    const results = {
      total: products.length,
      succeeded: 0,
      failed: 0,
      errors: []
    }

    // Разбиваем на батчи
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE)
      console.log(`📦 Обработка батча ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(products.length / BATCH_SIZE)}`)
      
      // Обновляем весь батч параллельно
      const promises = batch.map(product => 
        this.updateProductStock(product.id, {
          bar1: product.bar1,
          bar2: product.bar2,
          cold_room: product.cold_room || 0
        })
      )
      
      // Ждем завершения всех обновлений в батче
      const batchResults = await Promise.all(promises)
      
      // Подсчитываем результаты
      batchResults.forEach(result => {
        if (result.success) {
          results.succeeded++
        } else {
          results.failed++
          results.errors.push({
            productId: result.productId,
            error: result.error
          })
        }
      })
      
      // Небольшая задержка между батчами чтобы не перегрузить сервер
      if (i + BATCH_SIZE < products.length) {
        await delay(100)
      }
    }

    console.log(`✅ Синхронизация завершена: успешно ${results.succeeded}, ошибок ${results.failed}`)
    
    if (results.failed > 0) {
      console.error('❌ Ошибки при синхронизации:', results.errors)
      throw new Error(`Не удалось обновить ${results.failed} из ${results.total} продуктов`)
    }
    
    return results
  }

  /**
   * Загрузка профиля пользователя
   * УДАЛЕНО: Теперь не используется, роль определяется по email в AuthContext
   * Оставлено для обратной совместимости
   * 
   * @param {string} userId - UUID пользователя
   * @returns {Promise<Object>} Профиль пользователя
   */
  async fetchUserProfile(userId) {
    console.warn('⚠️ fetchUserProfile вызван, но не используется. Роль определяется по email.')
    
    // Возвращаем заглушку чтобы не ломать старый код
    return {
      id: userId,
      role: 'bar1',
      email: 'unknown@local'
    }
  }
}

// Экспорт единственного экземпляра API
export default new SupabaseAPI()
