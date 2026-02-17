/**
 * ============================================================
 * ЭКСПОРТ ДАННЫХ В CSV
 * ============================================================
 * 
 * ВЕРСИЯ 5.0 - РЕФАКТОРИНГ
 * 
 * ИЗМЕНЕНИЯ:
 * 1. ✅ Устранено дублирование кода через _buildAndDownload
 * 2. ✅ Исправлена двойная фильтрация
 * 3. ✅ Сохранена вся логика форматирования и сортировки
 * 
 * @version 5.0.0
 * @date 2026-02-15
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
 */
function sortProductsCorrectly(products, categories) {
  const categoryOrderMap = new Map(
    categories.map(cat => [cat.id, cat.order_index || 999])
  )
  
  return products.slice().sort((a, b) => {
    const catOrderA = categoryOrderMap.get(a.category_id) || 999
    const catOrderB = categoryOrderMap.get(b.category_id) || 999
    
    if (catOrderA !== catOrderB) {
      return catOrderA - catOrderB
    }
    
    const orderA = a.order_index || 999
    const orderB = b.order_index || 999
    
    return orderA - orderB
  })
}

/**
 * Внутренняя функция для генерации и скачивания CSV
 */
function _buildAndDownload(products, categories, filename) {
  try {
    const sorted = sortProductsCorrectly(products, categories)
    const headers = ['Наименование', 'Бар 1 (Факт)', 'Бар 2 (Факт)', 'Холод. комната (Факт)', 'ИТОГО']
    
    const rows = sorted.map(p => {
      const b1 = parseFloat(p.bar1) || 0
      const b2 = parseFloat(p.bar2) || 0
      const cr = parseFloat(p.cold_room) || 0
      return [
        p.name || '',
        formatNumberForCSV(b1),
        formatNumberForCSV(b2),
        formatNumberForCSV(cr),
        formatNumberForCSV(b1 + b2 + cr)
      ]
    })

    const csv = ['\uFEFF' + headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(link.href)
    return { success: true, recordsCount: sorted.length }
  } catch (error) {
    console.error('Ошибка экспорта:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Экспорт всех активных продуктов (по умолчанию)
 */
export function exportToCSV(products, categories = [], filename = 'стоки_бара') {
  return _buildAndDownload(products.filter(p => !p.is_frozen), categories, filename)
}

/**
 * Экспорт только замороженных продуктов
 */
export function exportFrozenToCSV(products, categories, filename = 'замороженные') {
  return _buildAndDownload(products.filter(p => p.is_frozen), categories, filename)
}

/**
 * Экспорт активных продуктов (алиас для exportToCSV)
 */
export function exportActiveToCSV(products, categories, filename = 'активные') {
  return exportToCSV(products, categories, filename)
}

/**
 * Экспорт конкретной категории
 */
export function exportCategoryToCSV(products, categoryId, categories, filename) {
  const cat = categories.find(c => c.id === categoryId)
  return _buildAndDownload(
    products.filter(p => p.category_id === categoryId && !p.is_frozen),
    categories,
    `${filename}_${cat?.name || 'category'}`
  )
}

/**
 * Экспорт видимых для конкретного бара продуктов
 */
export function exportBarVisibleProducts(products, barName, categories, filename) {
  const visibilityField = `visible_to_${barName}`
  return _buildAndDownload(
    products.filter(p => p[visibilityField] === true && !p.is_frozen),
    categories,
    `${filename}_${barName}`
  )
}

export default {
  exportToCSV,
  exportCategoryToCSV,
  exportFrozenToCSV,
  exportActiveToCSV,
  exportBarVisibleProducts
}
