/**
 * ============================================================
 * ЭКСПОРТ ДАННЫХ В CSV
 * ============================================================
 * 
 * ВЕРСИЯ 3.1 - ИСПРАВЛЕН ФИЛЬТР ЗАМОРОЖЕННЫХ
 * 
 * ИСПРАВЛЕНИЯ:
 * 1. ✅ Правильное округление ИТОГО (без 0.0000001)
 * 2. ✅ Строгий порядок как в базе (category → product)
 * 3. ✅ Дробные числа через формулу ="число"
 * 4. ✅ ФИЛЬТР ЗАМОРОЖЕННЫХ - НЕ экспортируются is_frozen = true
 * 
 * @version 3.1.0
 * @date 2026-02-14
 * @author Claude
 * ============================================================
 */

/**
 * Форматирование числа для CSV экспорта
 * 
 * @param {number} value - Числовое значение
 * @returns {string} Отформатированное значение для CSV
 */
function formatNumberForCSV(value) {
  if (value === null || value === undefined || value === '') {
    return '0'
  }
  
  const numValue = parseFloat(value)
  
  if (isNaN(numValue)) {
    return '0'
  }
  
  // КРИТИЧНО: Округляем до 2 знаков
  const rounded = Math.round(numValue * 100) / 100
  
  // Если целое число → возвращаем как есть
  if (Number.isInteger(rounded)) {
    return rounded.toString()
  }
  
  // Если дробное → оборачиваем в формулу Excel
  const formatted = rounded.toString()
  
  return `="${formatted}"`
}

/**
 * Сортировка продуктов в правильном порядке
 * 
 * @param {Array<Object>} products - Массив продуктов
 * @param {Array<Object>} categories - Массив категорий
 * @returns {Array<Object>} Отсортированный массив
 */
function sortProductsCorrectly(products, categories) {
  const categoryOrderMap = new Map(
    categories.map(cat => [cat.id, cat.order_index || 999])
  )
  
  return products.slice().sort((a, b) => {
    const catOrderA = categoryOrderMap.get(a.category_id) || 999
    const catOrderB = categoryOrderMap.get(b.category_id) || 999
    
    // Сортировка по категории
    if (catOrderA !== catOrderB) {
      return catOrderA - catOrderB
    }
    
    // Внутри категории по order_index продукта
    const orderA = a.order_index || 999
    const orderB = b.order_index || 999
    
    return orderA - orderB
  })
}

/**
 * ============================================================
 * ГЛАВНАЯ ФУНКЦИЯ ЭКСПОРТА
 * ============================================================
 */

/**
 * Экспорт продуктов в CSV файл
 * 
 * КРИТИЧНО: Замороженные продукты (is_frozen = true) НЕ экспортируются!
 * 
 * @param {Array<Object>} products - Массив продуктов для экспорта
 * @param {Array<Object>} categories - Массив категорий
 * @param {string} filename - Имя файла (без расширения)
 * @returns {Object} Результат экспорта
 */
export function exportToCSV(products, categories = [], filename = 'стоки_бара') {
  try {
    console.log(`📤 Экспорт: исходных продуктов ${products.length}`)

    // ============================================================
    // ШАГ 1: ФИЛЬТРАЦИЯ ЗАМОРОЖЕННЫХ
    // ============================================================
    // КРИТИЧНО: Убираем замороженные продукты (is_frozen = true)
    const activeProducts = products.filter(p => p.is_frozen !== true)
    
    console.log(`❄️ Замороженных: ${products.length - activeProducts.length}`)
    console.log(`✅ К экспорту: ${activeProducts.length}`)

    // ============================================================
    // ШАГ 2: СОРТИРОВКА в правильном порядке
    // ============================================================
    const sortedProducts = sortProductsCorrectly(activeProducts, categories)
    console.log(`✅ Продукты отсортированы`)

    // ============================================================
    // ШАГ 3: ЗАГОЛОВКИ
    // ============================================================
    const headers = [
      'Наименование',
      'Тара мл',
      'Бар 1 (Факт)',
      'Бар 2 (Факт)',
      'Холод. комната (Факт)',
      'ИТОГО'
    ]

    // ============================================================
    // ШАГ 4: ФОРМИРОВАНИЕ СТРОК ДАННЫХ
    // ============================================================
    const rows = sortedProducts.map(product => {
      const bar1 = parseFloat(product.bar1) || 0
      const bar2 = parseFloat(product.bar2) || 0
      const coldRoom = parseFloat(product.cold_room) || 0
      
      const total = bar1 + bar2 + coldRoom

      return [
        product.name || '',                    // Наименование
        product.volume || 'л',                 // Тара
        formatNumberForCSV(bar1),              // Бар 1
        formatNumberForCSV(bar2),              // Бар 2
        formatNumberForCSV(coldRoom),          // Холодная комната
        formatNumberForCSV(total)              // ИТОГО
      ]
    })

    // ============================================================
    // ШАГ 5: ОБЪЕДИНЕНИЕ В CSV
    // ============================================================
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n')

    // ============================================================
    // ШАГ 6: СОЗДАНИЕ BLOB С BOM
    // ============================================================
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    })

    // ============================================================
    // ШАГ 7: СКАЧИВАНИЕ ФАЙЛА
    // ============================================================
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    const date = new Date().toISOString().split('T')[0]
    const finalFilename = `${filename}_${date}.csv`
    
    link.setAttribute('href', url)
    link.setAttribute('download', finalFilename)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)

    console.log(`✅ CSV экспортирован: ${finalFilename}`)
    console.log(`📊 Записей: ${sortedProducts.length}`)
    
    return {
      success: true,
      filename: finalFilename,
      recordsCount: sortedProducts.length
    }

  } catch (error) {
    console.error('❌ Ошибка экспорта CSV:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * ============================================================
 * ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ЭКСПОРТА
 * ============================================================
 */

/**
 * Экспорт с фильтрацией по категории
 * КРИТИЧНО: Замороженные продукты НЕ экспортируются
 * 
 * @param {Array<Object>} products - Все продукты
 * @param {string} categoryId - ID категории для фильтра
 * @param {Array<Object>} categories - Массив категорий
 * @param {string} filename - Имя файла
 * @returns {Object} Результат экспорта
 */
export function exportCategoryToCSV(products, categoryId, categories, filename) {
  const filtered = products.filter(p => 
    p.category_id === categoryId && p.is_frozen !== true
  )
  const category = categories.find(c => c.id === categoryId)
  const categoryName = category?.name || 'category'
  
  console.log(`📦 Экспорт категории: ${categoryName} (${filtered.length} активных продуктов)`)
  
  return exportToCSV(
    filtered, 
    categories, 
    `${filename}_${categoryName}`
  )
}

/**
 * Экспорт только замороженных продуктов
 * 
 * @param {Array<Object>} products - Все продукты
 * @param {Array<Object>} categories - Массив категорий
 * @param {string} filename - Имя файла
 * @returns {Object} Результат экспорта
 */
export function exportFrozenToCSV(products, categories, filename = 'замороженные') {
  const frozen = products.filter(p => p.is_frozen === true)
  
  console.log(`❄️ Экспорт замороженных: ${frozen.length} продуктов`)
  
  // Для замороженных используем прямую функцию без фильтра
  return exportToCSVInternal(frozen, categories, filename)
}

/**
 * Внутренняя функция экспорта БЕЗ фильтра замороженных
 * Используется для exportFrozenToCSV
 */
function exportToCSVInternal(products, categories, filename) {
  try {
    const sortedProducts = sortProductsCorrectly(products, categories)
    
    const headers = [
      'Наименование',
      'Тара мл',
      'Бар 1 (Факт)',
      'Бар 2 (Факт)',
      'Холод. комната (Факт)',
      'ИТОГО'
    ]

    const rows = sortedProducts.map(product => {
      const bar1 = parseFloat(product.bar1) || 0
      const bar2 = parseFloat(product.bar2) || 0
      const coldRoom = parseFloat(product.cold_room) || 0
      const total = bar1 + bar2 + coldRoom

      return [
        product.name || '',
        product.volume || 'л',
        formatNumberForCSV(bar1),
        formatNumberForCSV(bar2),
        formatNumberForCSV(coldRoom),
        formatNumberForCSV(total)
      ]
    })

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n')

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    })

    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    const date = new Date().toISOString().split('T')[0]
    const finalFilename = `${filename}_${date}.csv`
    
    link.setAttribute('href', url)
    link.setAttribute('download', finalFilename)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return {
      success: true,
      filename: finalFilename,
      recordsCount: sortedProducts.length
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Экспорт только активных (незамороженных) продуктов
 * 
 * @param {Array<Object>} products - Все продукты
 * @param {Array<Object>} categories - Массив категорий
 * @param {string} filename - Имя файла
 * @returns {Object} Результат экспорта
 */
export function exportActiveToCSV(products, categories, filename = 'активные') {
  const active = products.filter(p => p.is_frozen !== true)
  
  console.log(`✅ Экспорт активных: ${active.length} продуктов`)
  
  return exportToCSV(active, categories, filename)
}

/**
 * Экспорт с фильтром по видимости для бара
 * КРИТИЧНО: Замороженные продукты НЕ экспортируются
 * 
 * @param {Array<Object>} products - Все продукты
 * @param {string} barName - 'bar1' или 'bar2'
 * @param {Array<Object>} categories - Массив категорий
 * @param {string} filename - Имя файла
 * @returns {Object} Результат экспорта
 */
export function exportBarVisibleProducts(products, barName, categories, filename) {
  const visibilityField = `visible_to_${barName}`
  const visible = products.filter(p => 
    p[visibilityField] === true && p.is_frozen !== true
  )
  
  console.log(`👁️ Экспорт видимых для ${barName}: ${visible.length} продуктов`)
  
  return exportToCSV(visible, categories, `${filename}_${barName}`)
}

/**
 * ============================================================
 * ЭКСПОРТ ПО УМОЛЧАНИЮ
 * ============================================================
 */
export default {
  exportToCSV,
  exportCategoryToCSV,
  exportFrozenToCSV,
  exportActiveToCSV,
  exportBarVisibleProducts
}