/**
 * API слой для работы с Supabase
 * Изолирует всю логику работы с базой данных
 */

import { createClient } from '@supabase/supabase-js'

// Конфигурация Supabase из переменных окружения
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Проверка наличия переменных окружения
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Ошибка: Необходимо настроить переменные окружения VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY')
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

    const { data, error } = await this.client
      .from('categories')
      .select('*')
      .order('order_index')

    if (error) throw error
    return data
  }

  /**
   * Загрузка всех продуктов из БД
   * @returns {Promise<Array>} Массив продуктов
   */
  async fetchProducts() {
    if (!this.client) throw new Error('Supabase не инициализирован')

    const { data, error } = await this.client
      .from('products')
      .select('*')
      .order('category_id')

    if (error) throw error
    return data
  }

  /**
   * Обновление остатков продукта в БД
   * @param {number} productId - ID продукта
   * @param {Object} updates - Объект с обновлениями (bar1, bar2, cold_room)
   */
  async updateProductStock(productId, updates) {
    if (!this.client) throw new Error('Supabase не инициализирован')

    const { error } = await this.client
      .from('products')
      .update(updates)
      .eq('id', productId)

    if (error) throw error
  }

  /**
   * Синхронизация всех продуктов с БД
   * @param {Array} products - Массив продуктов для синхронизации
   */
  async syncAll(products) {
    if (!this.client) throw new Error('Supabase не инициализирован')

    for (const product of products) {
      await this.updateProductStock(product.id, {
        bar1: product.bar1,
        bar2: product.bar2,
        cold_room: product.cold_room || 0
      })
    }
  }

  /**
   * Загрузка профиля пользователя
   * @param {string} userId - UUID пользователя
   * @returns {Promise<Object>} Профиль пользователя
   */
  async fetchUserProfile(userId) {
    if (!this.client) throw new Error('Supabase не инициализирован')

    const { data, error } = await this.client
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  }
}

// Экспорт единственного экземпляра API
export default new SupabaseAPI()
