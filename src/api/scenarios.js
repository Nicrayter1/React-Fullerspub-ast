/**
 * ============================================================
 * API для работы со сценариями флагов
 * ============================================================
 * 
 * Сценарии - это режимы работы бара:
 * - СТОКИ (красный флаг) - еженедельный учет ~75 позиций
 * - РЕВИЗИЯ (зеленый флаг) - полная инвентаризация ~847 позиций
 * - ДОЛГАЯ ЗАМОРОЗКА (желтый флаг) - архив/сезонные товары ~15 позиций
 * 
 * ЛОГИКА:
 * Запуск сценария = заморозить всё, что БЕЗ этого флага
 * Остановка = разморозить всё
 * 
 * @version 1.0.0
 * @date 2026-02-12
 * ============================================================
 */

import { supabaseClient } from './supabase'
import { log, warn, error, isDev } from '../utils/logger'

/**
 * ============================================================
 * ТИПЫ СЦЕНАРИЕВ
 * ============================================================
 */
export const SCENARIO_TYPES = {
  STOCKS: {
    id: 'stocks',
    name: 'Стоки',
    flag: 'red_flag',
    color: 'red',
    icon: '🔴',
    description: 'Еженедельный учет основных позиций'
  },
  REVISION: {
    id: 'revision',
    name: 'Ревизия',
    flag: 'green_flag',
    color: 'green',
    icon: '🟢',
    description: 'Полная инвентаризация всех позиций'
  },
  LONG_FREEZE: {
    id: 'long_freeze',
    name: 'Долгая заморозка',
    flag: 'yellow_flag',
    color: 'yellow',
    icon: '🟡',
    description: 'Архивные и сезонные товары'
  }
}

/**
 * ============================================================
 * ЗАПУСК СЦЕНАРИЯ
 * ============================================================
 * 
 * Логика: Заморозить всё, что БЕЗ указанного флага
 * 
 * @param {string} scenarioType - Тип сценария ('stocks', 'revision', 'long_freeze')
 * @param {string} userEmail - Email пользователя (для логирования)
 * @returns {Promise<Object>} Результат выполнения
 */
export async function runScenario(scenarioType, userEmail) {
  try {
    log(`🎬 Запуск сценария: ${scenarioType}`)
    
    // Получить конфигурацию сценария
    const scenario = Object.values(SCENARIO_TYPES).find(s => s.id === scenarioType)
    
    if (!scenario) {
      throw new Error(`Неизвестный тип сценария: ${scenarioType}`)
    }
    
    // ============================================================
    // ШАГ 1: Получить все продукты
    // ============================================================
    const { data: allProducts, error: fetchError } = await supabaseClient
      .from('products')
      .select('id, name, ' + scenario.flag)
    
    if (fetchError) {
      error('❌ Ошибка получения продуктов:', fetchError)
      throw fetchError
    }
    
    log(`📊 Всего продуктов: ${allProducts.length}`)
    
    // ============================================================
    // ШАГ 2: Разделить на две группы
    // ============================================================
    const withFlag = allProducts.filter(p => p[scenario.flag] === true)
    const withoutFlag = allProducts.filter(p => p[scenario.flag] === false)
    
    log(`✅ С флагом ${scenario.icon}: ${withFlag.length}`)
    log(`❌ Без флага: ${withoutFlag.length}`)
    
    // ============================================================
    // ШАГ 3: Заморозить продукты БЕЗ флага
    // ============================================================
    if (withoutFlag.length > 0) {
      const idsToFreeze = withoutFlag.map(p => p.id)
      
      const { error: freezeError } = await supabaseClient
        .from('products')
        .update({
          is_frozen: true,
          visible_to_bar1: false,
          visible_to_bar2: false,
          frozen_at: new Date().toISOString(),
          frozen_by: userEmail
        })
        .in('id', idsToFreeze)
      
      if (freezeError) {
        error('❌ Ошибка заморозки:', freezeError)
        throw freezeError
      }
      
      log(`❄️ Заморожено: ${withoutFlag.length} позиций`)
    }
    
    // ============================================================
    // ШАГ 4: Разморозить продукты С флагом (на всякий случай)
    // ============================================================
    if (withFlag.length > 0) {
      const idsToUnfreeze = withFlag.map(p => p.id)
      
      const { error: unfreezeError } = await supabaseClient
        .from('products')
        .update({
          is_frozen: false,
          visible_to_bar1: true,
          visible_to_bar2: true,
          frozen_at: null,
          frozen_by: null
        })
        .in('id', idsToUnfreeze)
      
      if (unfreezeError) {
        error('❌ Ошибка разморозки:', unfreezeError)
        throw unfreezeError
      }
      
      log(`🔥 Разморожено: ${withFlag.length} позиций`)
    }
    
    // ============================================================
    // РЕЗУЛЬТАТ
    // ============================================================
    return {
      success: true,
      scenario: scenario.name,
      activeProducts: withFlag.length,
      frozenProducts: withoutFlag.length,
      message: `Сценарий "${scenario.name}" запущен. Активно: ${withFlag.length}, заморожено: ${withoutFlag.length}`
    }
    
  } catch (err) {
    error('❌ Критическая ошибка запуска сценария:', err)
    return {
      success: false,
      error: err.message
    }
  }
}

/**
 * ============================================================
 * ОСТАНОВКА ВСЕХ СЦЕНАРИЕВ
 * ============================================================
 * 
 * Логика: Разморозить ВСЕ продукты
 * 
 * @returns {Promise<Object>} Результат выполнения
 */
export async function stopAllScenarios() {
  try {
    log('⏹️ Остановка всех сценариев')
    
    // ============================================================
    // Разморозить ВСЕ продукты
    // ============================================================
    const { error: stopError } = await supabaseClient
      .from('products')
      .update({
        is_frozen: false,
        visible_to_bar1: true,
        visible_to_bar2: true,
        frozen_at: null,
        frozen_by: null
      })
      .neq('id', 0) // Все продукты (условие всегда true)

    if (stopError) {
      error('❌ Ошибка разморозки:', stopError)
      throw stopError
    }

    log('✅ Все продукты разморожены')

    return {
      success: true,
      message: 'Все сценарии остановлены. Все продукты активны.'
    }

  } catch (err) {
    error('❌ Критическая ошибка остановки сценариев:', err)
    return {
      success: false,
      error: err.message
    }
  }
}

/**
 * ============================================================
 * ПОЛУЧИТЬ СТАТИСТИКУ ПО ФЛАГАМ
 * ============================================================
 * 
 * Подсчитывает сколько продуктов имеют каждый флаг
 * 
 * @returns {Promise<Object>} Статистика
 */
export async function getFlagsStatistics() {
  try {
    const { data: products, error: fetchError } = await supabaseClient
      .from('products')
      .select('red_flag, green_flag, yellow_flag')

    if (fetchError) throw fetchError

    const stats = {
      total: products.length,
      red: products.filter(p => p.red_flag).length,
      green: products.filter(p => p.green_flag).length,
      yellow: products.filter(p => p.yellow_flag).length,
      noFlags: products.filter(p => !p.red_flag && !p.green_flag && !p.yellow_flag).length
    }

    return {
      success: true,
      stats
    }

  } catch (err) {
    error('❌ Ошибка получения статистики:', err)
    return {
      success: false,
      error: err.message
    }
  }
}

/**
 * ============================================================
 * ОБНОВИТЬ ФЛАГИ ПРОДУКТА
 * ============================================================
 * 
 * @param {number} productId - ID продукта
 * @param {Object} flags - Объект с флагами {red: true, green: false, yellow: true}
 * @returns {Promise<Object>} Результат
 */
export async function updateProductFlags(productId, flags) {
  try {
    log(`🏴 Обновление флагов для продукта ${productId}:`, flags)
    
    const { error: updateError } = await supabaseClient
      .from('products')
      .update({
        red_flag: flags.red ?? false,
        green_flag: flags.green ?? false,
        yellow_flag: flags.yellow ?? false
      })
      .eq('id', productId)

    if (updateError) throw updateError

    return { success: true }

  } catch (err) {
    error('❌ Ошибка обновления флагов:', err)
    return {
      success: false,
      error: err.message
    }
  }
}