/**
 * ============================================================
 * API для админ-операций
 * ============================================================
 * 
 * Модуль для работы с административными функциями:
 * - Заморозка/разморозка продуктов
 * - Удаление продуктов
 * - Изменение порядка продуктов (drag & drop)
 * 
 * ВАЖНО: Эти операции доступны только для роли 'manager'
 * Проверка прав доступа выполняется на клиенте и в RLS политиках Supabase
 * 
 * @version 2.0.0
 * @author Admin Team
 * @date 2026-02-14
 * @note ЛОГИРОВАНИЕ ОТКЛЮЧЕНО
 * ============================================================
 */

import { supabaseClient } from './supabase'
import { log, warn, error, isDev } from '../utils/logger'

/**
 * ============================================================
 * ЗАМОРОЗКА И РАЗМОРОЗКА ПРОДУКТОВ
 * ============================================================
 */

/**
 * Заморозить продукт
 * После заморозки продукт:
 * - Не отображается в списках баров (bar1, bar2)
 * - Нельзя изменять остатки
 * - Помечается как is_frozen = true
 * 
 * @param {number} productId - ID продукта для заморозки
 * @param {string} userEmail - Email пользователя (менеджера)
 * @param {Object} options - Дополнительные опции
 * @param {boolean} options.hideFromBar1 - Скрыть от бара 1 (default: true)
 * @param {boolean} options.hideFromBar2 - Скрыть от бара 2 (default: true)
 * @returns {Promise<Object>} Результат операции
 */
export async function freezeProduct(productId, userEmail, options = {}) {
  try {
    log(`❄️ Заморозка продукта ${productId} пользователем ${userEmail}`)

    const {
      hideFromBar1 = true,
      hideFromBar2 = true
    } = options

    // Получаем информацию о продукте перед заморозкой
    const { data: product, error: fetchError } = await supabaseClient
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (fetchError) {
      error('❌ Ошибка получения продукта:', fetchError)
      throw fetchError
    }

    if (!product) {
      throw new Error('Продукт не найден')
    }

    // Проверяем, не заморожен ли уже продукт
    if (product.is_frozen) {
      warn('⚠️ Продукт уже заморожен')
      return {
        success: false,
        error: 'Продукт уже заморожен',
        alreadyFrozen: true
      }
    }

    // Обновляем продукт - устанавливаем флаг заморозки
    const { data: freezeData, error: freezeError } = await supabaseClient
      .from('products')
      .update({
        is_frozen: true,
        frozen_at: new Date().toISOString(),
        frozen_by: userEmail,
        visible_to_bar1: !hideFromBar1,  // Инвертируем: если hideFromBar1 = true, то visible = false
        visible_to_bar2: !hideFromBar2
      })
      .eq('id', productId)
      .select()
      .single()

    if (freezeError) {
      error('❌ Ошибка заморозки продукта:', freezeError)
      throw freezeError
    }

    log('✅ Продукт успешно заморожен')
    return {
      success: true,
      data: freezeData,
      message: `Продукт "${product.name}" заморожен`
    }

  } catch (err) {
    error('❌ Критическая ошибка заморозки:', err)
    return {
      success: false,
      error: err.message
    }
  }
}

/**
 * Разморозить продукт
 * Восстанавливает видимость и возможность редактирования
 * 
 * @param {number} productId - ID продукта для разморозки
 * @param {string} userEmail - Email пользователя (менеджера)
 * @returns {Promise<Object>} Результат операции
 */
export async function unfreezeProduct(productId, userEmail) {
  try {
    log(`🔥 Разморозка продукта ${productId} пользователем ${userEmail}`)

    // Получаем информацию о продукте перед разморозкой
    const { data: product, error: fetchError } = await supabaseClient
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (fetchError) {
      error('❌ Ошибка получения продукта:', fetchError)
      throw fetchError
    }

    if (!product) {
      throw new Error('Продукт не найден')
    }

    // Проверяем, заморожен ли продукт
    if (!product.is_frozen) {
      warn('⚠️ Продукт не заморожен')
      return {
        success: false,
        error: 'Продукт не заморожен',
        notFrozen: true
      }
    }

    // Обновляем продукт - снимаем флаг заморозки
    const { data: unfreezeData, error: unfreezeError } = await supabaseClient
      .from('products')
      .update({
        is_frozen: false,
        frozen_at: null,
        frozen_by: null,
        visible_to_bar1: true,  // Восстанавливаем видимость
        visible_to_bar2: true
      })
      .eq('id', productId)
      .select()
      .single()

    if (unfreezeError) {
      error('❌ Ошибка разморозки продукта:', unfreezeError)
      throw unfreezeError
    }

    log('✅ Продукт успешно разморожен')
    return {
      success: true,
      data: unfreezeData,
      message: `Продукт "${product.name}" разморожен`
    }

  } catch (err) {
    error('❌ Критическая ошибка разморозки:', err)
    return {
      success: false,
      error: err.message
    }
  }
}

/**
 * ============================================================
 * УДАЛЕНИЕ ПРОДУКТОВ
 * ============================================================
 */

/**
 * Удалить продукт из базы данных
 * ВАЖНО: Это необратимая операция!
 * 
 * @param {number} productId - ID продукта для удаления
 * @param {string} userEmail - Email пользователя (менеджера)
 * @returns {Promise<Object>} Результат операции
 */
export async function deleteProduct(productId, userEmail) {
  try {
    log(`🗑️ Удаление продукта ${productId} пользователем ${userEmail}`)

    // Получаем информацию о продукте перед удалением
    const { data: product, error: fetchError } = await supabaseClient
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (fetchError) {
      error('❌ Ошибка получения продукта:', fetchError)
      throw fetchError
    }

    if (!product) {
      throw new Error('Продукт не найден')
    }

    // Выполняем удаление
    const { error: deleteError } = await supabaseClient
      .from('products')
      .delete()
      .eq('id', productId)

    if (deleteError) {
      error('❌ Ошибка удаления продукта:', deleteError)
      throw deleteError
    }

    log('✅ Продукт успешно удален')
    return {
      success: true,
      message: `Продукт "${product.name}" удален`,
      deletedProduct: product
    }

  } catch (err) {
    error('❌ Критическая ошибка удаления:', err)
    return {
      success: false,
      error: err.message
    }
  }
}

/**
 * ============================================================
 * ИЗМЕНЕНИЕ ПОРЯДКА ПРОДУКТОВ
 * ============================================================
 */

/**
 * Обновить порядок продуктов (используется для drag & drop)
 * Обновляет order_index для каждого продукта
 * 
 * @param {Array<Object>} products - Массив продуктов с новыми order_index
 *                                   Формат: [{id: 1, order_index: 1}, ...]
 * @param {string} userEmail - Email пользователя (менеджера)
 * @param {number} categoryId - ID категории (для логирования)
 * @returns {Promise<Object>} Результат операции
 */
export async function updateProductsOrder(products, userEmail, categoryId = null) {
  try {
    log(`🔄 Обновление порядка ${products.length} продуктов пользователем ${userEmail}`)

    if (!products || products.length === 0) {
      return {
        success: true,
        message: 'Нет продуктов для обновления',
        updated: 0
      }
    }

    // Подготавливаем массив обновлений для каждого продукта
    const updates = products.map(product => ({
      id: product.id,
      order_index: product.order_index
    }))

    // Выполняем обновление для каждого продукта
    const updatePromises = updates.map(update =>
      supabaseClient
        .from('products')
        .update({ order_index: update.order_index })
        .eq('id', update.id)
    )

    const results = await Promise.allSettled(updatePromises)

    // Подсчитываем успешные и неудачные обновления
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    log(`✅ Обновлено ${successful} из ${products.length} продуктов`)

    if (failed > 0) {
      warn(`⚠️ Не удалось обновить ${failed} продуктов`)
    }

    return {
      success: failed === 0,
      updated: successful,
      failed: failed,
      total: products.length,
      message: failed === 0
        ? 'Порядок продуктов обновлен'
        : `Обновлено ${successful} из ${products.length} продуктов`
    }

  } catch (err) {
    error('❌ Критическая ошибка обновления порядка:', err)
    return {
      success: false,
      error: err.message,
      updated: 0,
      failed: products.length
    }
  }
}

/**
 * ============================================================
 * ЭКСПОРТ
 * ============================================================
 */
export default {
  freezeProduct,
  unfreezeProduct,
  deleteProduct,
  updateProductsOrder
}
