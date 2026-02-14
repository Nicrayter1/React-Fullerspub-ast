/**
 * ============================================================
 * ЭКСПОРТ ДАННЫХ В CSV
 * ============================================================
 * 
 * ВЕРСИЯ 3.0 - ПОЛНОСТЬЮ ПЕРЕПИСАНО
 * 
 * ИСПРАВЛЕНИЯ:
 * 1. ✅ Правильное округление ИТОГО (без 0.0000001)
 * 2. ✅ Строгий порядок как в базе (category.order_index → product.order_index)
 * 3. ✅ Дробные числа через формулу ="число"
 * 4. ✅ UTF-8 с BOM для Excel
 * 
 * @version 3.0.0
 * @date 2026-02-14
 * @author Claude
 * ============================================================
 */

/**
 * Форматирование числа для CSV экспорта
 * 
 * КРИТИЧНО: 
 * - Округляет до 2 знаков после запятой
 * - Убирает trailing zeros (5.00 → 5)
 * - Дробные оборачивает в ="число"
 * 
 * @param {number} value - Числовое значение
 * @returns {string} Отформатированное значение для CSV
 */
function formatNumberForCSV(value) {
  // Если пусто, null, undefined → 0
  if (value === null || value === undefined || value === '') {
    return '0'
  }
  
  // Преобразуем в число
  const numValue = parseFloat(value)
  
  // Проверка на NaN
  if (isNaN(numValue)) {
    return '0'
  }
  
  // КРИТИЧНО: Округляем до 2 знаков, чтобы избежать 5.800000000001
  const rounded = Math.round(numValue * 100) / 100
  
  // Если целое число → возвращаем как есть
  if (Number.isInteger(rounded)) {
    return rounded.toString()
  }
  
  // Если дробное → оборачиваем в формулу Excel
  // Убираем trailing zeros: 5.50 → 5.5
  const formatted = rounded.toString()
  
  return `="${formatted}"`
}

/**
 * Сортировка продуктов в правильном порядке
 * 
 * КРИТИЧНО: Порядок СТРОГО как в базе данных
 * 1. Сортировка по category.order_index (возрастание)
 * 2. Внутри категории по product.order_index (возрастание)
 * 
 * @param {Array<Object>} products - Массив продуктов
 * @param {Array<Object>} categories - Массив категорий
 * @returns {Array<Object>} Отсортированный массив
 */
function sortProductsCorrectly(products, categories) {
  // Создаем Map категорий для быстрого поиска order_index
  const categoryOrderMap = new Map(
    categories.map(cat => [cat.id, cat.order_index || 999])
  )
  
  return products.slice().sort((a, b) => {
    // Получаем order_index категорий
    const catOrderA = categoryOrderMap.get(a.category_id) || 999
    const catOrderB = categoryOrderMap.get(b.category_id) || 999
    
    // ПЕРВЫЙ уровень сортировки: по категории
    if (catOrderA !== catOrderB) {
      return catOrderA - catOrderB
    }
    
    // ВТОРОЙ уровень сортировки: внутри категории по order_index продукта
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
 * ФОРМАТ:
 * Наименование;Тара мл;Бар 1 (Факт);Бар 2 (Факт);Холод. комната (Факт);ИТОГО
 * 
 * ОСОБЕННОСТИ:
 * - Продукты в СТРОГОМ порядке как в базе
 * - ИТОГО округлено до 2 знаков
 * - Дробные числа через ="число"
 * - UTF-8 с BOM для Excel
 * 
 * @param {Array<Object>} products - Массив продуктов для экспорта
 * @param {Array<Object>} categories - Массив категорий
 * @param {string} filename - Имя файла (без расширения)
 * @returns {Object} Результат экспорта
 */
export function exportToCSV(products, categories = [], filename = 'стоки_бара') {
  try {
    console.log(`📤 Экспорт ${products.length} продуктов в CSV`)
    console.log(`📋 Категорий: ${categories.length}`)

    // ============================================================
    // ШАГ 1: СОРТИРОВКА в правильном порядке
    // ============================================================
    const sortedProducts = sortProductsCorrectly(products, categories)
    console.log(`✅ Продукты отсортированы по категориям и order_index`)

    // ============================================================
    // ШАГ 2: ЗАГОЛОВКИ
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
    // ШАГ 3: ФОРМИРОВАНИЕ СТРОК ДАННЫХ
    // ============================================================
    const rows = sortedProducts.map(product => {
      // Получаем значения с приведением к числу
      const bar1 = parseFloat(product.bar1) || 0
      const bar2 = parseFloat(product.bar2) || 0
      const coldRoom = parseFloat(product.cold_room) || 0
      
      // КРИТИЧНО: Вычисляем ИТОГО с округлением
      const total = bar1 + bar2 + coldRoom

      // Формируем строку CSV
      return [
        product.name || '',                    // Наименование
        product.volume || 'л',                 // Тара
        formatNumberForCSV(bar1),              // Бар 1
        formatNumberForCSV(bar2),              // Бар 2
        formatNumberForCSV(coldRoom),          // Холодная комната
        formatNumberForCSV(total)              // ИТОГО (округлено!)
      ]
    })

    // ============================================================
    // ШАГ 4: ОБЪЕДИНЕНИЕ В CSV
    // ============================================================
    const csvContent = [
      headers.join(';'),                       // Заголовки
      ...rows.map(row => row.join(';'))       // Данные
    ].join('\n')

    // ============================================================
    // ШАГ 5: СОЗДАНИЕ BLOB С BOM ДЛЯ EXCEL
    // ============================================================
    // BOM (Byte Order Mark) для правильной кодировки UTF-8 в Excel
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    })

    // ============================================================
    // ШАГ 6: СКАЧИВАНИЕ ФАЙЛА
    // ============================================================
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    // Формируем имя файла с датой
    const date = new Date().toISOString().split('T')[0]
    const finalFilename = `${filename}_${date}.csv`
    
    link.setAttribute('href', url)
    link.setAttribute('download', finalFilename)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Очистка URL
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
 * 
 * @param {Array<Object>} products - Все продукты
 * @param {string} categoryId - ID категории для фильтра
 * @param {Array<Object>} categories - Массив категорий
 * @param {string} filename - Имя файла
 * @returns {Object} Результат экспорта
 */
export function exportCategoryToCSV(products, categoryId, categories, filename) {
  const filtered = products.filter(p => p.category_id === categoryId)
  const category = categories.find(c => c.id === categoryId)
  const categoryName = category?.name || 'category'
  
  console.log(`📦 Экспорт категории: ${categoryName} (${filtered.length} продуктов)`)
  
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
  
  return exportToCSV(frozen, categories, filename)
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
 * 
 * @param {Array<Object>} products - Все продукты
 * @param {string} barName - 'bar1' или 'bar2'
 * @param {Array<Object>} categories - Массив категорий
 * @param {string} filename - Имя файла
 * @returns {Object} Результат экспорта
 */
export function exportBarVisibleProducts(products, barName, categories, filename) {
  const visibilityField = `visible_to_${barName}`
  const visible = products.filter(p => p[visibilityField] === true)
  
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