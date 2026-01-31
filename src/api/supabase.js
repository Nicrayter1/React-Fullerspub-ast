/**
 * ============================================================
 * API слой для работы с Supabase
 * ============================================================
 * 
 * Версия: 2.1.0 - ИСПРАВЛЕНО
 * Дата обновления: 2026-01-31
 * 
 * ИСПРАВЛЕНИЯ v2.1:
 * ✅ Улучшенная обработка ошибок в syncAll()
 * ✅ Понятные сообщения для пользователя
 * ✅ Возврат userMessage для UI
 * ✅ Не выбрасывает исключение при частичном успехе
 * 
 * @version 2.1.0
 * @author Migration Team
 * @date 2026-01-31
 * ============================================================
 */

import { createClient } from '@supabase/supabase-js'
import { bulkUpdateProducts } from './bulkOperations'

// ============================================================
// КОНФИГУРАЦИЯ SUPABASE
// ============================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Ошибка: Необходимо настроить переменные окружения')
  console.error('   VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY')
}

/**
 * ============================================================
 * КЛИЕНТ SUPABASE
 * ============================================================
 */
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

/**
 * ============================================================
 * ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
 * ============================================================
 */

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * ============================================================
 * КЛАСС API
 * ============================================================
 */
class SupabaseAPI {
  constructor() {
    this.client = supabaseClient
  }

  /**
   * ============================================================
   * ЗАГРУЗКА КАТЕГОРИЙ
   * ============================================================
   */
  async fetchCategories() {
    if (!this.client) {
      throw new Error('Supabase клиент не инициализирован')
    }

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
   * ============================================================
   * ЗАГРУЗКА ПРОДУКТОВ
   * ============================================================
   */
  async fetchProducts() {
    if (!this.client) {
      throw new Error('Supabase клиент не инициализирован')
    }

    console.log('📦 Загрузка продуктов...')
    
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .order('order_index', { nullsLast: true })

    if (error) {
      console.error('❌ Ошибка загрузки продуктов:', error)
      throw error
    }
    
    console.log(`✅ Загружено ${data.length} продуктов`)
    return data
  }

  /**
   * ============================================================
   * ОБНОВЛЕНИЕ ОДНОГО ПРОДУКТА
   * ============================================================
   */
  async updateProductStock(productId, updates, retryCount = 0) {
    if (!this.client) {
      throw new Error('Supabase клиент не инициализирован')
    }

    try {
      const { error } = await this.client
        .from('products')
        .update(updates)
        .eq('id', productId)

      if (error) throw error
      
      return { success: true, productId }
      
    } catch (error) {
      if (retryCount < 2 && (
        error.message.includes('fetch') || 
        error.message.includes('network')
      )) {
        console.warn(`⚠️ Повтор обновления продукта ${productId}, попытка ${retryCount + 1}`)
        await delay(1000 * (retryCount + 1))
        return this.updateProductStock(productId, updates, retryCount + 1)
      }
      
      console.error(`❌ Ошибка обновления продукта ${productId}:`, error)
      return { 
        success: false, 
        productId, 
        error: error.message 
      }
    }
  }

  /**
   * ============================================================
   * МАССОВОЕ ОБНОВЛЕНИЕ ПРОДУКТОВ (Bulk RPC)
   * ============================================================
   * 
   * ✅ ВЕРСИЯ v2.1 - ИСПРАВЛЕНО
   * 
   * ИЗМЕНЕНИЯ:
   * - Не выбрасывает исключение при частичном успехе
   * - Возвращает понятное сообщение для пользователя (userMessage)
   * - Улучшенная обработка CORS и сетевых ошибок
   * - Детальное логирование для отладки
   * 
   * @param {Array} products - Массив продуктов для синхронизации
   * @returns {Promise<Object>}
   * 
   * Формат возврата:
   * {
   *   success: boolean,        // true только если все успешно
   *   total: number,           // Всего продуктов
   *   updated: number,         // Успешно обновлено
   *   failed: number,          // Количество ошибок
   *   errors: Array,           // Детали ошибок
   *   duration: number,        // Время выполнения (мс)
   *   userMessage: string,     // Сообщение для показа пользователю
   *   hasCORSErrors: boolean   // Были ли CORS ошибки
   * }
   */
  async syncAll(products) {
    // ============================================================
    // ВАЛИДАЦИЯ
    // ============================================================
    
    if (!this.client) {
      throw new Error('Supabase клиент не инициализирован')
    }
    
    if (!products || products.length === 0) {
      console.log('⚠️ syncAll: нет продуктов для синхронизации')
      return { 
        success: true, 
        total: 0, 
        updated: 0, 
        failed: 0,
        errors: [],
        duration: 0,
        userMessage: 'Нет данных для сохранения',
        hasCORSErrors: false
      }
    }

    console.log(`🔄 Начало синхронизации ${products.length} продуктов через Bulk RPC...`)
    
    // ============================================================
    // ВЫЗОВ BULK RPC
    // ============================================================
    
    try {
      const result = await bulkUpdateProducts(products)
      
      // ============================================================
      // АНАЛИЗ РЕЗУЛЬТАТА
      // ============================================================
      
      console.log('📊 Результат синхронизации:', {
        success: result.success,
        updated: result.updated,
        failed: result.failed,
        total: result.total,
        duration: result.duration
      })
      
      // ВАЖНО: Не выбрасываем исключение даже если есть ошибки
      // Вместо этого возвращаем детальную информацию для UI
      
      if (result.success) {
        console.log('✅ Синхронизация завершена успешно')
      } else if (result.updated > 0) {
        console.warn(`⚠️ Частичная синхронизация: ${result.updated}/${result.total}`)
        if (result.hasCORSErrors) {
          console.warn('⚠️ Обнаружены CORS ошибки - возможно проблема с сетью')
        }
      } else {
        console.error('❌ Синхронизация не удалась')
        if (result.hasCORSErrors) {
          console.error('❌ Причина: CORS/сетевые ошибки')
        }
      }
      
      // Логируем ошибки если есть
      if (result.errors.length > 0) {
        console.group('📋 Детали ошибок:')
        result.errors.forEach((error, index) => {
          console.error(`${index + 1}.`, error)
        })
        console.groupEnd()
      }
      
      return result
      
    } catch (error) {
      // ============================================================
      // ОБРАБОТКА КРИТИЧЕСКИХ ОШИБОК
      // ============================================================
      
      console.error('❌ Критическая ошибка синхронизации:', error)
      
      // Формируем понятный ответ даже при критической ошибке
      return {
        success: false,
        total: products.length,
        updated: 0,
        failed: products.length,
        errors: [{
          error: error.message || 'Unknown error',
          type: 'critical'
        }],
        duration: 0,
        userMessage: `❌ Критическая ошибка: ${error.message || 'Не удалось подключиться к серверу'}`,
        hasCORSErrors: error.message?.toLowerCase().includes('cors') || 
                       error.message?.toLowerCase().includes('network')
      }
    }
  }

  /**
   * ============================================================
   * ЗАГРУЗКА ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ
   * ============================================================
   */
  async fetchUserProfile(userId) {
    console.warn('⚠️ fetchUserProfile устарел. Роль определяется по email в AuthContext')
    
    return {
      id: userId,
      role: 'bar1',
      email: 'unknown@local'
    }
  }
}

/**
 * ============================================================
 * ЭКСПОРТ
 * ============================================================
 */

export default new SupabaseAPI()
