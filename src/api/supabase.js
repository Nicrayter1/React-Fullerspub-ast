/**
 * API слой для работы с Supabase
 * Изолирует всю логику работы с базой данных
 */

import { createClient } from '@supabase/supabase-js'

// Конфигурация Supabase
const SUPABASE_URL = 'https://lmysveosqckpbyuldiym.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxteXN2ZW9zcWNrcGJ5dWxkaXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTMxNTksImV4cCI6MjA4MDM4OTE1OX0.z1i_Fi7uCXnX3cml7RbTHR6RxIrxVY947iOCTi80fQY'

/**
 * Класс для работы с Supabase API
 */
class SupabaseAPI {
  constructor() {
    this.client = null
    this.initialize()
  }

  /**
   * Инициализация клиента Supabase
   */
  initialize() {
    try {
      this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    } catch (error) {
      console.error('Ошибка инициализации Supabase:', error)
    }
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
}

// Экспорт единственного экземпляра API
export default new SupabaseAPI()
