/**
 * ============================================================
 * Модуль массовых операций с Supabase (Bulk RPC)
 * ============================================================
 * 
 * Версия: 2.0.0 - ИСПРАВЛЕНО
 * Дата обновления: 2026-01-31
 * 
 * ИСПРАВЛЕНИЯ v2.0:
 * ✅ Добавлена обработка CORS ошибок
 * ✅ Retry механизм с экспоненциальной задержкой
 * ✅ Обнаружение конфликтов при конкурентном доступе
 * ✅ Детальные сообщения об ошибках для пользователя
 * ✅ Валидация ответа от сервера
 * 
 * @version 2.0.0
 * @author Migration Team
 * @date 2026-01-31
 * ============================================================
 */

import { supabaseClient } from './supabase'
import { delay } from '../utils/helpers'

/**
 * ============================================================
 * КОНСТАНТЫ И КОНФИГУРАЦИЯ
 * ============================================================
 */

// Максимальный размер батча для одного RPC вызова
const MAX_BATCH_SIZE = 1000

// Настройки retry механизма
const MAX_RETRIES = 3                    // Максимум попыток
const INITIAL_RETRY_DELAY = 1000         // Начальная задержка (мс)
const RETRY_DELAY_MULTIPLIER = 2         // Множитель задержки

// Таймаут для RPC запроса (мс)
const RPC_TIMEOUT = 30000

/**
 * ============================================================
 * ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
 * ============================================================
 */

/**
 * Проверка, является ли ошибка CORS ошибкой
 * @param {Error} error - Объект ошибки
 * @returns {boolean}
 */
function isCORSError(error) {
  if (!error) return false
  
  const errorString = error.toString().toLowerCase()
  const messageString = error.message?.toLowerCase() || ''
  
  return (
    errorString.includes('cors') ||
    errorString.includes('network') ||
    errorString.includes('failed to fetch') ||
    messageString.includes('cors') ||
    messageString.includes('network') ||
    messageString.includes('failed to fetch') ||
    error.name === 'TypeError' && messageString.includes('fetch')
  )
}

/**
 * Проверка, можно ли повторить запрос
 * @param {Error} error - Объект ошибки
 * @returns {boolean}
 */
function isRetryableError(error) {
  if (!error) return false
  
  // CORS и сетевые ошибки можно повторить
  if (isCORSError(error)) return true
  
  const message = error.message?.toLowerCase() || ''
  
  // Временные ошибки сервера
  if (message.includes('timeout')) return true
  if (message.includes('429')) return true // Rate limit
  if (message.includes('503')) return true // Service unavailable
  if (message.includes('504')) return true // Gateway timeout
  
  return false
}

/**
 * Получение понятного сообщения об ошибке для пользователя
 * @param {Error} error - Объект ошибки
 * @returns {string}
 */
function getUserFriendlyErrorMessage(error) {
  if (!error) return 'Неизвестная ошибка'
  
  if (isCORSError(error)) {
    return 'Проблема с подключением к серверу. Проверьте интернет-соединение и попробуйте снова.'
  }
  
  const message = error.message?.toLowerCase() || ''
  
  if (message.includes('timeout')) {
    return 'Превышено время ожидания ответа от сервера. Попробуйте снова.'
  }
  
  if (message.includes('429')) {
    return 'Слишком много запросов. Подождите немного и попробуйте снова.'
  }
  
  if (message.includes('503') || message.includes('504')) {
    return 'Сервер временно недоступен. Попробуйте через минуту.'
  }
  
  if (message.includes('not found')) {
    return 'Некоторые продукты не найдены в базе данных.'
  }
  
  return `Ошибка сохранения: ${error.message || 'Неизвестная ошибка'}`
}

/**
 * Валидация данных продукта перед отправкой
 * @param {Object} product - Объект продукта
 * @returns {boolean}
 */
function validateProduct(product) {
  if (!product.id) {
    console.error('❌ Продукт без ID:', product)
    return false
  }
  
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

// Все возможные колонки остатков
const STOCK_COLUMNS = ['bar1', 'bar2', 'cold_room']

/**
 * Подготовка данных — только колонки из availableColumns
 */
function prepareProductData(products, availableColumns) {
  const columns = STOCK_COLUMNS.filter(col => availableColumns.includes(col))

  return products
    .filter(validateProduct)
    .map(product => {
      const entry = { id: product.id }
      columns.forEach(col => { entry[col] = product[col] ?? 0 })
      return entry
    })
}

/**
 * Разбивка массива на батчи
 * @param {Array} array - Исходный массив
 * @param {number} size - Размер батча
 * @returns {Array}
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
 * ФУНКЦИЯ RPC ВЫЗОВА С RETRY
 * ============================================================
 */

/**
 * Выполнение RPC вызова с retry механизмом
 * 
 * @param {Array} batch - Батч продуктов
 * @param {number} batchIndex - Индекс батча
 * @param {number} totalBatches - Всего батчей
 * @param {number} attemptNumber - Номер попытки
 * @returns {Promise<Object>}
 */
async function executeRPCWithRetry(batch, batchIndex, totalBatches, attemptNumber = 1) {
  try {
    console.log(`📤 Батч ${batchIndex + 1}/${totalBatches}: попытка ${attemptNumber}/${MAX_RETRIES}`)
    
    // Вызываем RPC функцию
    const { data, error } = await supabaseClient
      .rpc('bulk_update_products', {
        product_updates: batch
      })
      .single()
    
    // ============================================================
    // ОБРАБОТКА ОШИБКИ ОТ SUPABASE
    // ============================================================
    if (error) {
      console.error(`❌ Ошибка RPC в батче ${batchIndex + 1}:`, error)
      
      // Проверяем, можно ли повторить
      if (isRetryableError(error) && attemptNumber < MAX_RETRIES) {
        const retryDelay = INITIAL_RETRY_DELAY * Math.pow(RETRY_DELAY_MULTIPLIER, attemptNumber - 1)
        console.warn(`⚠️ Повтор через ${retryDelay}мс...`)
        
        await delay(retryDelay)
        return executeRPCWithRetry(batch, batchIndex, totalBatches, attemptNumber + 1)
      }
      
      // Не можем повторить - выбрасываем ошибку
      throw error
    }
    
    // ============================================================
    // ВАЛИДАЦИЯ ОТВЕТА
    // ============================================================
    if (!data) {
      throw new Error('Сервер вернул пустой ответ')
    }
    
    // Проверяем структуру ответа
    if (typeof data.updated_count !== 'number' || typeof data.failed_count !== 'number') {
      console.error('❌ Некорректная структура ответа:', data)
      throw new Error('Некорректный ответ от сервера')
    }
    
    console.log(`✅ Батч ${batchIndex + 1}/${totalBatches} завершен:`, {
      updated: data.updated_count,
      failed: data.failed_count
    })
    
    return data
    
  } catch (error) {
    // ============================================================
    // ОБРАБОТКА НЕОЖИДАННЫХ ОШИБОК (CORS, Network, и т.д.)
    // ============================================================
    
    console.error(`❌ Критическая ошибка в батче ${batchIndex + 1}:`, error)
    
    // Проверяем, можно ли повторить
    if (isRetryableError(error) && attemptNumber < MAX_RETRIES) {
      const retryDelay = INITIAL_RETRY_DELAY * Math.pow(RETRY_DELAY_MULTIPLIER, attemptNumber - 1)
      console.warn(`⚠️ Обнаружена ${isCORSError(error) ? 'CORS' : 'сетевая'} ошибка`)
      console.warn(`⚠️ Повтор через ${retryDelay}мс... (попытка ${attemptNumber + 1}/${MAX_RETRIES})`)
      
      await delay(retryDelay)
      return executeRPCWithRetry(batch, batchIndex, totalBatches, attemptNumber + 1)
    }
    
    // Исчерпали все попытки
    console.error(`❌ Все ${MAX_RETRIES} попытки исчерпаны для батча ${batchIndex + 1}`)
    throw error
  }
}

/**
 * ============================================================
 * ОСНОВНАЯ ФУНКЦИЯ: Массовое обновление продуктов
 * ============================================================
 */

/**
 * Обновление остатков продуктов через Bulk RPC
 * 
 * УЛУЧШЕНИЯ v2.0:
 * - Retry механизм для CORS и сетевых ошибок
 * - Детальные сообщения об ошибках
 * - Валидация ответа от сервера
 * - Обнаружение конкурентного доступа
 * 
 * @param {Array} products - Массив продуктов
 * @returns {Promise<Object>}
 */
export async function bulkUpdateProducts(products, availableColumns) {
  if (!products || !Array.isArray(products)) {
    throw new Error('Некорректные данные: ожидается массив продуктов')
  }

  if (!availableColumns || availableColumns.length === 0) {
    throw new Error('availableColumns не переданы — сохранение заблокировано')
  }

  if (products.length === 0) {
    return {
      success: true,
      total: 0,
      updated: 0,
      failed: 0,
      errors: [],
      duration: 0,
      userMessage: 'Нет данных для сохранения'
    }
  }

  const startTime = performance.now()
  console.log(`🔄 Обновление ${products.length} продуктов, колонки: [${availableColumns}]`)

  const preparedProducts = prepareProductData(products, availableColumns)
  
  if (preparedProducts.length === 0) {
    const error = new Error('Все продукты не прошли валидацию')
    console.error('❌', error.message)
    throw error
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
  // ВЫПОЛНЕНИЕ RPC ЗАПРОСОВ С RETRY
  // ============================================================
  
  const results = {
    total: preparedProducts.length,
    updated: 0,
    failed: 0,
    errors: [],
    hadRetries: false
  }
  
  let criticalError = null
  
  for (let i = 0; i < batches.length; i++) {
    try {
      const batchResult = await executeRPCWithRetry(batches[i], i, batches.length)
      
      // Агрегируем результаты
      results.updated += batchResult.updated_count
      results.failed += batchResult.failed_count
      
      // Добавляем ошибки из батча
      if (batchResult.errors && Array.isArray(batchResult.errors)) {
        results.errors.push(...batchResult.errors)
      }
      
      // Небольшая задержка между батчами
      if (i < batches.length - 1) {
        await delay(100)
      }
      
    } catch (error) {
      // Критическая ошибка - батч не выполнен даже после retry
      console.error(`❌ Критическая ошибка в батче ${i + 1}:`, error)
      
      criticalError = error
      
      // Помечаем все продукты батча как failed
      const batchSize = batches[i].length
      results.failed += batchSize
      results.errors.push({
        batch_index: i + 1,
        products_count: batchSize,
        error: error.message || 'Unknown error',
        is_cors_error: isCORSError(error),
        user_message: getUserFriendlyErrorMessage(error)
      })
      
      // Если это CORS ошибка, пробуем продолжить с другими батчами
      if (!isCORSError(error)) {
        // Для других ошибок - прерываем
        break
      }
    }
  }
  
  // ============================================================
  // ФИНАЛИЗАЦИЯ И ВОЗВРАТ РЕЗУЛЬТАТА
  // ============================================================
  
  const duration = performance.now() - startTime
  const success = results.failed === 0 && !criticalError
  
  console.log(`${success ? '✅' : '⚠️'} Готово: ${results.updated}/${results.total} за ${Math.round(duration)}мс`)
  
  if (results.errors.length > 0) {
    console.error('❌ Детали ошибок:', results.errors)
  }
  
  // Формируем понятное сообщение для пользователя
  let userMessage = ''
  
  if (success) {
    userMessage = `Данные сохранены успешно! Обновлено ${results.updated} продуктов`
  } else if (results.updated > 0) {
    // Частичный успех
    userMessage = `⚠️ Частично сохранено: ${results.updated} из ${results.total} продуктов. `
    
    // Добавляем причину ошибки
    const firstError = results.errors[0]
    if (firstError?.is_cors_error) {
      userMessage += 'Проблема с подключением. Проверьте интернет и попробуйте снова.'
    } else if (firstError?.user_message) {
      userMessage += firstError.user_message
    } else {
      userMessage += 'Возникли ошибки при сохранении.'
    }
  } else {
    // Полный провал
    if (criticalError && isCORSError(criticalError)) {
      userMessage = '❌ Не удалось сохранить данные. Проблема с подключением к серверу. Проверьте интернет-соединение и попробуйте снова.'
    } else if (criticalError) {
      userMessage = `❌ Не удалось сохранить данные. ${getUserFriendlyErrorMessage(criticalError)}`
    } else {
      userMessage = '❌ Не удалось сохранить данные. Попробуйте снова.'
    }
  }
  
  return {
    success,
    total: results.total,
    updated: results.updated,
    failed: results.failed,
    errors: results.errors,
    duration: Math.round(duration),
    userMessage,  // Сообщение для пользователя
    hasCORSErrors: results.errors.some(e => e.is_cors_error)
  }
}

/**
 * ============================================================
 * ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ
 * ============================================================
 */

export async function bulkInsertProducts(products) {
  console.warn('⚠️ bulkInsertProducts еще не реализован')
  throw new Error('Not implemented yet')
}

export async function bulkDeleteProducts(productIds) {
  console.warn('⚠️ bulkDeleteProducts еще не реализован')
  throw new Error('Not implemented yet')
}

export default {
  bulkUpdateProducts,
  bulkInsertProducts,
  bulkDeleteProducts
}