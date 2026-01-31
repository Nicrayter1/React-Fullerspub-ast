/**
 * ============================================================
 * Модуль массовых операций с Supabase (Bulk RPC)
 * ============================================================
 * 
 * Описание:
 * Предоставляет оптимизированные методы для массового обновления
 * данных в Supabase с использованием RPC (Remote Procedure Call).
 * 
 * Преимущества:
 * - Один запрос вместо сотен
 * - Транзакционная целостность
 * - Высокая скорость (10-20x быстрее)
 * - Меньше нагрузки на API
 * 
 * @version 1.0.0
 * @author Migration Team
 * @date 2026-01-31
 * ============================================================
 */

import { supabaseClient } from './supabase'

/**
 * ============================================================
 * КОНСТАНТЫ И КОНФИГУРАЦИЯ
 * ============================================================
 */

// Максимальный размер батча для одного RPC вызова
// Supabase рекомендует не превышать 1000 записей за раз
const MAX_BATCH_SIZE = 1000

// Таймаут для RPC запроса (мс)
const RPC_TIMEOUT = 30000 // 30 секунд

/**
 * ============================================================
 * ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
 * ============================================================
 */

/**
 * Валидация данных продукта перед отправкой
 * 
 * @param {Object} product - Объект продукта
 * @returns {boolean} - true если данные валидны
 */
function validateProduct(product) {
  // Проверка обязательных полей
  if (!product.id) {
    console.error('❌ Продукт без ID:', product)
    return false
  }
  
  // Проверка типов данных
  if (product.bar1 !== undefined && typeof product.bar1 !== 'number') {
    console.error('❌ bar1 должен быть числом для продукта', product.id)
    return false
  }
  
  if (product.bar2 !== undefined && typeof product.bar2 !== 'number') {
    console.error('❌ bar2 должен быть числом для продукта', product.id)
    return false
  }
  
  if (product.cold_room !== undefined && typeof product.cold_room !== 'number') {
    console.error('❌ cold_room должен быть числом для продукта', product.id)
    return false
  }
  
  return true
}

/**
 * Подготовка данных для RPC функции
 * Очищает и форматирует данные продуктов
 * 
 * @param {Array} products - Массив продуктов
 * @returns {Array} - Отформатированный массив
 */
function prepareProductData(products) {
  return products
    .filter(validateProduct) // Фильтруем невалидные продукты
    .map(product => ({
      id: product.id,
      bar1: product.bar1 ?? 0,       // Используем nullish coalescing для дефолтных значений
      bar2: product.bar2 ?? 0,
      cold_room: product.cold_room ?? 0
    }))
}

/**
 * Разбивка массива на батчи заданного размера
 * 
 * @param {Array} array - Исходный массив
 * @param {number} size - Размер батча
 * @returns {Array} - Массив батчей
 */
function chunkArray(array, size) {
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * ============================================================
 * ОСНОВНАЯ ФУНКЦИЯ: Массовое обновление продуктов
 * ============================================================
 */

/**
 * Обновление остатков продуктов через Bulk RPC
 * 
 * Процесс:
 * 1. Валидация и подготовка данных
 * 2. Разбивка на батчи (если продуктов > MAX_BATCH_SIZE)
 * 3. Параллельный вызов RPC для каждого батча
 * 4. Агрегация результатов
 * 5. Обработка ошибок
 * 
 * @param {Array} products - Массив продуктов с полями: id, bar1, bar2, cold_room
 * @returns {Promise<Object>} - Результат операции
 * 
 * Формат возврата:
 * {
 *   success: boolean,           // Успешность операции
 *   total: number,              // Всего продуктов
 *   updated: number,            // Успешно обновлено
 *   failed: number,             // Ошибок
 *   errors: Array,              // Детали ошибок
 *   duration: number            // Время выполнения (мс)
 * }
 */
export async function bulkUpdateProducts(products) {
  // ============================================================
  // ВАЛИДАЦИЯ ВХОДНЫХ ДАННЫХ
  // ============================================================
  
  if (!products || !Array.isArray(products)) {
    console.error('❌ bulkUpdateProducts: ожидается массив продуктов')
    throw new Error('Invalid input: products must be an array')
  }
  
  if (products.length === 0) {
    console.log('⚠️ bulkUpdateProducts: пустой массив продуктов')
    return {
      success: true,
      total: 0,
      updated: 0,
      failed: 0,
      errors: [],
      duration: 0
    }
  }
  
  // ============================================================
  // ПОДГОТОВКА ДАННЫХ
  // ============================================================
  
  const startTime = performance.now()
  console.log(`🔄 Начало массового обновления ${products.length} продуктов...`)
  
  // Подготавливаем и валидируем данные
  const preparedProducts = prepareProductData(products)
  
  if (preparedProducts.length === 0) {
    console.error('❌ Все продукты не прошли валидацию')
    throw new Error('No valid products to update')
  }
  
  if (preparedProducts.length < products.length) {
    console.warn(
      `⚠️ Отфильтровано ${products.length - preparedProducts.length} невалидных продуктов`
    )
  }
  
  // ============================================================
  // РАЗБИВКА НА БАТЧИ
  // ============================================================
  
  const batches = chunkArray(preparedProducts, MAX_BATCH_SIZE)
  console.log(`📦 Создано ${batches.length} батч(ей) для обновления`)
  
  // ============================================================
  // ВЫПОЛНЕНИЕ RPC ЗАПРОСОВ
  // ============================================================
  
  const results = {
    total: preparedProducts.length,
    updated: 0,
    failed: 0,
    errors: []
  }
  
  try {
    // Обрабатываем все батчи параллельно
    const batchPromises = batches.map(async (batch, index) => {
      console.log(`📤 Отправка батча ${index + 1}/${batches.length} (${batch.length} продуктов)`)
      
      // Вызываем RPC функцию
      const { data, error } = await supabaseClient
        .rpc('bulk_update_products', {
          product_updates: batch
        })
        .single() // Ожидаем один объект результата
      
      if (error) {
        console.error(`❌ Ошибка в батче ${index + 1}:`, error)
        throw error
      }
      
      console.log(`✅ Батч ${index + 1}/${batches.length} завершен:`, data)
      return data
    })
    
    // Ждем завершения всех батчей
    const batchResults = await Promise.all(batchPromises)
    
    // ============================================================
    // АГРЕГАЦИЯ РЕЗУЛЬТАТОВ
    // ============================================================
    
    batchResults.forEach(result => {
      results.updated += result.updated_count
      results.failed += result.failed_count
      
      // Добавляем ошибки из батча
      if (result.errors && Array.isArray(result.errors)) {
        results.errors.push(...result.errors)
      }
    })
    
  } catch (error) {
    // ============================================================
    // ОБРАБОТКА КРИТИЧЕСКИХ ОШИБОК
    // ============================================================
    
    console.error('❌ Критическая ошибка при массовом обновлении:', error)
    
    const duration = performance.now() - startTime
    
    return {
      success: false,
      total: results.total,
      updated: results.updated,
      failed: results.total - results.updated,
      errors: [
        ...results.errors,
        {
          product_id: 'bulk_operation',
          error: error.message || 'Unknown error'
        }
      ],
      duration: Math.round(duration)
    }
  }
  
  // ============================================================
  // ФИНАЛИЗАЦИЯ И ВОЗВРАТ РЕЗУЛЬТАТА
  // ============================================================
  
  const duration = performance.now() - startTime
  const success = results.failed === 0
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`${success ? '✅' : '⚠️'} Массовое обновление завершено`)
  console.log(`📊 Статистика:`)
  console.log(`   • Всего: ${results.total}`)
  console.log(`   • Успешно: ${results.updated}`)
  console.log(`   • Ошибок: ${results.failed}`)
  console.log(`   • Время: ${Math.round(duration)}мс`)
  console.log(`   • Скорость: ${Math.round(results.total / (duration / 1000))} продуктов/сек`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  if (results.errors.length > 0) {
    console.error('❌ Ошибки обновления:', results.errors)
  }
  
  return {
    success,
    total: results.total,
    updated: results.updated,
    failed: results.failed,
    errors: results.errors,
    duration: Math.round(duration)
  }
}

/**
 * ============================================================
 * ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ РАСШИРЕНИЯ
 * ============================================================
 */

/**
 * Массовое создание продуктов (для будущего расширения)
 * 
 * @param {Array} products - Массив новых продуктов
 * @returns {Promise<Object>} - Результат операции
 */
export async function bulkInsertProducts(products) {
  // TODO: Реализовать после создания соответствующей RPC функции
  console.warn('⚠️ bulkInsertProducts еще не реализован')
  throw new Error('Not implemented yet')
}

/**
 * Массовое удаление продуктов (для будущего расширения)
 * 
 * @param {Array} productIds - Массив ID продуктов для удаления
 * @returns {Promise<Object>} - Результат операции
 */
export async function bulkDeleteProducts(productIds) {
  // TODO: Реализовать после создания соответствующей RPC функции
  console.warn('⚠️ bulkDeleteProducts еще не реализован')
  throw new Error('Not implemented yet')
}

/**
 * ============================================================
 * ЭКСПОРТ ПО УМОЛЧАНИЮ
 * ============================================================
 */

export default {
  bulkUpdateProducts,
  bulkInsertProducts,
  bulkDeleteProducts
}
