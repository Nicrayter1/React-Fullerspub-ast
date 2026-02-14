/**
 * ============================================================
 * ЭКСПОРТ ДАННЫХ В CSV
 * ============================================================
 * 
 * Функция для экспорта данных продуктов в CSV формат
 * С поддержкой правильного форматирования дробных чисел для Excel
 * 
 * ИЗМЕНЕНИЯ v2.0:
 * - Убрана колонка "Категория"
 * - Добавлена колонка "ИТОГО" (сумма Бар1 + Бар2 + Холод)
 * - Сохранена обработка дробных чисел через ="число"
 * 
 * @version 2.0.0
 * @date 2026-02-14
 * ============================================================
 */

/**
 * Форматирование числа для CSV экспорта
 * Дробные числа оборачиваются в формулу ="число"
 * чтобы Excel не превращал их в даты
 * 
 * @param {number} value - Числовое значение
 * @returns {string} Отформатированное значение
 */
function formatNumberForCSV(value) {
  if (value === null || value === undefined || value === '') {
    return '0'
  }
  
  const numValue = parseFloat(value)
  
  // Если целое число - возвращаем как есть
  if (Number.isInteger(numValue)) {
    return numValue.toString()
  }
  
  // Если дробное - оборачиваем в формулу Excel
  // ="2.5" чтобы Excel не превратил в дату
  return `="${numValue}"`
}

/**
 * Экспорт продуктов в CSV файл
 * 
 * @param {Array<Object>} products - Массив продуктов для экспорта
 * @param {Array<Object>} categories - Массив категорий (для получения названий)
 * @param {string} filename - Имя файла (без расширения)
 */
export function exportToCSV(products, categories = [], filename = 'стоки_бара') {
  try {
    console.log(`📤 Экспорт ${products.length} продуктов в CSV`)

    // Создаем Map категорий для быстрого поиска
    const categoryMap = new Map(
      categories.map(cat => [cat.id, cat.name])
    )

    // ЗАГОЛОВКИ (убрали "Категория", добавили "ИТОГО")
    const headers = [
      'Наименование',
      'Тара мл',
      'Бар 1 (Факт)',
      'Бар 2 (Факт)',
      'Холод. комната (Факт)',
      'ИТОГО'
    ]

    // Формируем строки данных
    const rows = products.map(product => {
      // Получаем значения
      const bar1 = parseFloat(product.bar1) || 0
      const bar2 = parseFloat(product.bar2) || 0
      const coldRoom = parseFloat(product.cold_room) || 0
      
      // ВЫЧИСЛЯЕМ ИТОГО
      const total = bar1 + bar2 + coldRoom

      return [
        product.name || '',                    // Наименование
        product.volume || 'л',                 // Тара
        formatNumberForCSV(bar1),              // Бар 1 (с формулой для дробных)
        formatNumberForCSV(bar2),              // Бар 2 (с формулой для дробных)
        formatNumberForCSV(coldRoom),          // Холодная комната (с формулой для дробных)
        formatNumberForCSV(total)              // ИТОГО (с формулой для дробных)
      ]
    })

    // Объединяем заголовки и строки
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n')

    // Добавляем BOM для корректной кодировки UTF-8 в Excel
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    })

    // Создаем ссылку для скачивания
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

    console.log(`✅ CSV экспортирован: ${finalFilename}`)
    
    return {
      success: true,
      filename: finalFilename,
      recordsCount: products.length
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
 * ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
 * ============================================================
 */

/**
 * Экспорт с фильтрацией по категории
 * 
 * @param {Array<Object>} products - Все продукты
 * @param {string} categoryId - ID категории для фильтра
 * @param {Array<Object>} categories - Массив категорий
 * @param {string} filename - Имя файла
 */
export function exportCategoryToCSV(products, categoryId, categories, filename) {
  const filtered = products.filter(p => p.category_id === categoryId)
  const category = categories.find(c => c.id === categoryId)
  const categoryName = category?.name || 'category'
  
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
 */
export function exportFrozenToCSV(products, categories, filename = 'замороженные') {
  const frozen = products.filter(p => p.is_frozen === true)
  return exportToCSV(frozen, categories, filename)
}

/**
 * Экспорт только активных (незамороженных) продуктов
 * 
 * @param {Array<Object>} products - Все продукты
 * @param {Array<Object>} categories - Массив категорий
 * @param {string} filename - Имя файла
 */
export function exportActiveToCSV(products, categories, filename = 'активные') {
  const active = products.filter(p => p.is_frozen !== true)
  return exportToCSV(active, categories, filename)
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
  exportActiveToCSV
}