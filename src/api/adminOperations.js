/**
 * ============================================================
 * API для админ-операций
 * ============================================================
 * 
 * Модуль для работы с административными функциями:
 * - Заморозка/разморозка продуктов
 * - Удаление продуктов
 * - Изменение порядка продуктов (drag & drop)
 * - Логирование действий в product_freeze_history
 * 
 * ВАЖНО: Эти операции доступны только для роли 'manager'
 * Проверка прав доступа выполняется на клиенте и в RLS политиках Supabase
 * 
 * @version 1.0.0
 * @author Admin Team
 * @date 2026-02-05
 * ============================================================
 */

import { supabaseClient } from './supabase'

/**
 * ============================================================
 * ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
 * ============================================================
 */

/**
 * Логирование действий с продуктами в таблицу product_freeze_history
 * Используется для аудита и истории изменений
 * 
 * @param {number} productId - ID продукта
 * @param {string} action - Тип действия: 'freeze', 'unfreeze', 'delete', 'reorder'
 * @param {string} performedBy - Email пользователя, выполнившего действие
 * @param {Object} metadata - Дополнительные данные о действии (опционально)
 * @returns {Promise<Object>} Результат логирования
 */
export async function logProductAction(productId, action, performedBy, metadata = {}) {
  try {
    console.log(`📝 Логирование действия: ${action} для продукта ${productId}`)
    
    const { data, error } = await supabaseClient
      .from('product_freeze_history')
      .insert([{
        product_id: productId,
        action: action,
        changed_by: performedBy,           // changed_by вместо performed_by
        changed_at: new Date().toISOString(), // changed_at вместо performed_at
        old_value: metadata.old_value || null,  // Используем old_value
        new_value: metadata.new_value || null   // Используем new_value
      }])
      .select()

    if (error) {
      console.error('❌ Ошибка логирования:', error)
      throw error
    }

    console.log('✅ Действие залогировано:', data)
    return { success: true, data: data[0] }

  } catch (error) {
    console.error('❌ Критическая ошибка логирования:', error)
    return { success: false, error: error.message }
  }
}

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
 * - Логируется дата и пользователь заморозки
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
    console.log(`❄️ Заморозка продукта ${productId} пользователем ${userEmail}`)

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
      console.error('❌ Ошибка получения продукта:', fetchError)
      throw fetchError
    }

    if (!product) {
      throw new Error('Продукт не найден')
    }

    // Проверяем, не заморожен ли уже продукт
    if (product.is_frozen) {
      console.warn('⚠️ Продукт уже заморожен')
      return {
        success: false,
        error: 'Продукт уже заморожен',
        alreadyFrozen: true
      }
    }

    // Обновляем продукт - устанавливаем флаг заморозки
    const { data, error } = await supabaseClient
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

    if (error) {
      console.error('❌ Ошибка заморозки продукта:', error)
      throw error
    }

    // Логируем действие в историю
    await logProductAction(productId, 'freeze', userEmail, {
      product_name: product.name,
      category_id: product.category_id,
      hide_from_bar1: hideFromBar1,
      hide_from_bar2: hideFromBar2,
      previous_state: {
        bar1: product.bar1,
        bar2: product.bar2,
        cold_room: product.cold_room
      }
    })

    console.log('✅ Продукт успешно заморожен')
    return {
      success: true,
      data: data,
      message: `Продукт "${product.name}" заморожен`
    }

  } catch (error) {
    console.error('❌ Критическая ошибка заморозки:', error)
    return {
      success: false,
      error: error.message
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
    console.log(`🔥 Разморозка продукта ${productId} пользователем ${userEmail}`)

    // Получаем информацию о продукте перед разморозкой
    const { data: product, error: fetchError } = await supabaseClient
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (fetchError) {
      console.error('❌ Ошибка получения продукта:', fetchError)
      throw fetchError
    }

    if (!product) {
      throw new Error('Продукт не найден')
    }

    // Проверяем, заморожен ли продукт
    if (!product.is_frozen) {
      console.warn('⚠️ Продукт не заморожен')
      return {
        success: false,
        error: 'Продукт не заморожен',
        notFrozen: true
      }
    }

    // Обновляем продукт - снимаем флаг заморозки
    const { data, error } = await supabaseClient
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

    if (error) {
      console.error('❌ Ошибка разморозки продукта:', error)
      throw error
    }

    // Логируем действие в историю
    await logProductAction(productId, 'unfreeze', userEmail, {
      product_name: product.name,
      category_id: product.category_id,
      was_frozen_at: product.frozen_at,
      was_frozen_by: product.frozen_by
    })

    console.log('✅ Продукт успешно разморожен')
    return {
      success: true,
      data: data,
      message: `Продукт "${product.name}" разморожен`
    }

  } catch (error) {
    console.error('❌ Критическая ошибка разморозки:', error)
    return {
      success: false,
      error: error.message
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
 * Перед удалением логируем информацию о продукте в историю
 * 
 * @param {number} productId - ID продукта для удаления
 * @param {string} userEmail - Email пользователя (менеджера)
 * @returns {Promise<Object>} Результат операции
 */
export async function deleteProduct(productId, userEmail) {
  try {
    console.log(`🗑️ Удаление продукта ${productId} пользователем ${userEmail}`)

    // Получаем информацию о продукте перед удалением
    const { data: product, error: fetchError } = await supabaseClient
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (fetchError) {
      console.error('❌ Ошибка получения продукта:', fetchError)
      throw fetchError
    }

    if (!product) {
      throw new Error('Продукт не найден')
    }

    // Логируем удаление ПЕРЕД удалением (чтобы сохранить всю информацию)
    await logProductAction(productId, 'delete', userEmail, {
      product_name: product.name,
      category_id: product.category_id,
      volume: product.volume,
      order_index: product.order_index,
      final_state: {
        bar1: product.bar1,
        bar2: product.bar2,
        cold_room: product.cold_room
      },
      was_frozen: product.is_frozen,
      deleted_at: new Date().toISOString()
    })

    // Выполняем удаление
    const { error } = await supabaseClient
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      console.error('❌ Ошибка удаления продукта:', error)
      throw error
    }

    console.log('✅ Продукт успешно удален')
    return {
      success: true,
      message: `Продукт "${product.name}" удален`,
      deletedProduct: product
    }

  } catch (error) {
    console.error('❌ Критическая ошибка удаления:', error)
    return {
      success: false,
      error: error.message
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
    console.log(`🔄 Обновление порядка ${products.length} продуктов пользователем ${userEmail}`)

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
    // ПРИМЕЧАНИЕ: Для оптимизации можно создать PostgreSQL функцию
    // для массового обновления order_index (аналогично bulk_update_products)
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

    // Логируем массовое изменение порядка
    if (successful > 0) {
      await logProductAction(
        products[0]?.id || 0,  // Используем ID первого продукта для референса
        'reorder',
        userEmail,
        {
          category_id: categoryId,
          products_count: products.length,
          successful_updates: successful,
          failed_updates: failed,
          product_ids: products.map(p => p.id)
        }
      )
    }

    console.log(`✅ Обновлено ${successful} из ${products.length} продуктов`)

    if (failed > 0) {
      console.warn(`⚠️ Не удалось обновить ${failed} продуктов`)
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

  } catch (error) {
    console.error('❌ Критическая ошибка обновления порядка:', error)
    return {
      success: false,
      error: error.message,
      updated: 0,
      failed: products.length
    }
  }
}

/**
 * ============================================================
 * ПОЛУЧЕНИЕ ИСТОРИИ ДЕЙСТВИЙ
 * ============================================================
 */

/**
 * Получить историю действий для продукта
 * 
 * @param {number} productId - ID продукта
 * @param {number} limit - Максимальное количество записей (default: 50)
 * @returns {Promise<Object>} История действий
 */
export async function getProductHistory(productId, limit = 50) {
  try {
    console.log(`📜 Получение истории для продукта ${productId}`)

    const { data, error } = await supabaseClient
      .from('product_freeze_history')
      .select('*')
      .eq('product_id', productId)
      .order('performed_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ Ошибка получения истории:', error)
      throw error
    }

    console.log(`✅ Получено ${data.length} записей истории`)
    return {
      success: true,
      data: data,
      count: data.length
    }

  } catch (error) {
    console.error('❌ Критическая ошибка получения истории:', error)
    return {
      success: false,
      error: error.message,
      data: []
    }
  }
}

/**
 * Получить всю историю действий (для админ-панели)
 * 
 * @param {Object} filters - Фильтры
 * @param {string} filters.action - Тип действия
 * @param {string} filters.performedBy - Email пользователя
 * @param {Date} filters.fromDate - Дата начала периода
 * @param {Date} filters.toDate - Дата окончания периода
 * @param {number} filters.limit - Максимальное количество записей (default: 100)
 * @returns {Promise<Object>} История действий
 */
export async function getAllHistory(filters = {}) {
  try {
    console.log('📜 Получение общей истории действий')

    const {
      action,
      performedBy,
      fromDate,
      toDate,
      limit = 100
    } = filters

    let query = supabaseClient
      .from('product_freeze_history')
      .select('*')
      .order('changed_at', { ascending: false })  // changed_at вместо performed_at
      .limit(limit)

    // Применяем фильтры
    if (action) {
      query = query.eq('action', action)
    }

    if (performedBy) {
      query = query.eq('changed_by', performedBy)  // changed_by вместо performed_by
    }

    if (fromDate) {
      query = query.gte('changed_at', fromDate.toISOString())  // changed_at
    }

    if (toDate) {
      query = query.lte('changed_at', toDate.toISOString())  // changed_at
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Ошибка получения истории:', error)
      throw error
    }

    console.log(`✅ Получено ${data.length} записей истории`)
    return {
      success: true,
      data: data,
      count: data.length
    }

  } catch (error) {
    console.error('❌ Критическая ошибка получения истории:', error)
    return {
      success: false,
      error: error.message,
      data: []
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
  updateProductsOrder,
  getProductHistory,
  getAllHistory,
  logProductAction
}
