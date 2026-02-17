/**
 * Вспомогательные функции общего назначения
 */

/**
 * Функция задержки выполнения
 * @param {number} ms - Время задержки в миллисекундах
 * @returns {Promise}
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
