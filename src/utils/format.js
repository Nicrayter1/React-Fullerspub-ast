/**
 * Утилиты для форматирования и парсинга данных
 */

/**
 * Форматирование числа для отображения
 * @param {number|string} value - Значение для форматирования
 * @returns {string} Отформатированная строка
 */
export const formatNumber = (value) => {
  if (value === 0 || value === '0') return '0'
  return value?.toString() || '0'
}

/**
 * Парсинг строки в число (с заменой запятой на точку)
 * @param {string} value - Строка для парсинга
 * @returns {number} Распарсенное число
 */
export const parseNumber = (value) => {
  // Заменяем запятую на точку для корректного парсинга
  const cleaned = value.replace(/,/g, '.')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}
