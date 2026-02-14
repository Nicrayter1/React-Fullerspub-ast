/**
 * ============================================================
 * ЭКСПОРТ ДАННЫХ В CSV
 * ============================================================
 * 
 * ВЕРСИЯ 4.0 - ФИНАЛЬНАЯ
 * 
 * ИЗМЕНЕНИЯ:
 * 1. ✅ Убрана колонка "Тара мл"
 * 2. ✅ Правильная сортировка СТРОГО внутри категории
 * 3. ✅ Округление ИТОГО (без 0.0000001)
 * 4. ✅ Фильтр замороженных
 * 5. ✅ Дробные числа через формулу ="число"
 * 
 * @version 4.0.0
 * @date 2026-02-14
 * @author Claude
 * ============================================================
 */

/**
 * Форматирование числа для CSV экспорта
 */
function formatNumberForCSV(value) {
  if (value === null || value === undefined || value === '') {
    return '0'
  }
  
  const numValue = parseFloat(value)
  
  if (isNaN(numValue)) {
    return '0'
  }
  
  // Округляем до 2 знаков
  const rounded = Math.round(numValue * 100) / 100
  
  // Если целое число
  if (Number.isInteger(rounded)) {
    return rounded.toString()
  }
  
  // Если дробное → формула Excel
  return `="${rounded.toString()}"`
}

/**
 * Сортировка продуктов СТРОГО по категориям
 * 
 * КРИТИЧНО: Сортировка ТОЛЬКО внутри категории!
 * Категория 11 (soft drinks) со всеми продуктами (включая San Pelegrino)
 * должна идти вместе, независимо от order_index
 */
function sortProductsCorrectly(products, categories) {
  // Map категорий для быстрого поиска
  const categoryOrderMap = new Map(
    categories.map(cat => [cat.id, cat.order_index || 999])
  )
  
  return products.slice().sort((a, b) => {
    // Получаем order_index категорий
    const catOrderA = categoryOrderMap.get(a.category_id) || 999
    const catOrderB = categoryOrderMap.get(b.category_id) || 999
    
    // ПЕРВЫЙ уровень: сортировка по категории
    if (catOrderA !== catOrderB) {
      return catOrderA - catOrderB
    }
    
    // ВТОРОЙ уровень: внутри ОДНОЙ категории по order_index продукта
    // ВАЖНО: Это сработает ТОЛЬКО если catOrderA === catOrderB
    // То есть продукты из одной категории
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
 * ФОРМАТ (БЕЗ колонки Тара):
 * Наименование;Бар 1 (Факт);Бар 2 (Факт);Холод. комната (Факт);ИТОГО
 */
export function exportToCSV(products, categories = [], filename = 'стоки_бара') {
  try {
    console.log(`📤 Экспорт: исходных продуктов ${products.length}`)

    // ============================================================
    // ШАГ 1: ФИЛЬТРАЦИЯ ЗАМОРОЖЕННЫХ
    // ============================================================
    const activeProducts = products.filter(p => p.is_frozen !== true)
    
    console.log(`❄️ Замороженных: ${products.length - activeProducts.length}`)
    console.log(`✅ К экспорту: ${activeProducts.length}`)

    // ============================================================
    // ШАГ 2: СОРТИРОВКА
    // ============================================================
    const sortedProducts = sortProductsCorrectly(activeProducts, categories)
    console.log(`✅ Продукты отсортированы по категориям`)

    // ============================================================
    // ШАГ 3: ЗАГОЛОВКИ (БЕЗ "Тара мл")
    // ============================================================
    const headers = [
      'Наименование',
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
        // УБРАНА колонка product.volume (Тара)
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
 */
export function exportCategoryToCSV(products, categoryId, categories, filename) {
  const filtered = products.filter(p => 
    p.category_id === categoryId && p.is_frozen !== true
  )
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
 */
export function exportFrozenToCSV(products, categories, filename = 'замороженные') {
  const frozen = products.filter(p => p.is_frozen === true)
  
  console.log(`❄️ Экспорт замороженных: ${frozen.length} продуктов`)
  
  return exportToCSVInternal(frozen, categories, filename)
}

/**
 * Внутренняя функция экспорта БЕЗ фильтра замороженных
 */
function exportToCSVInternal(products, categories, filename) {
  try {
    const sortedProducts = sortProductsCorrectly(products, categories)
    
    const headers = [
      'Наименование',
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
 * Экспорт только активных продуктов
 */
export function exportActiveToCSV(products, categories, filename = 'активные') {
  const active = products.filter(p => p.is_frozen !== true)
  
  console.log(`✅ Экспорт активных: ${active.length} продуктов`)
  
  return exportToCSV(active, categories, filename)
}

/**
 * Экспорт с фильтром по видимости для бара
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