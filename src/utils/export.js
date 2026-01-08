/**
 * Утилита для экспорта данных в CSV
 */

/**
 * Экспорт продуктов в CSV файл
 * @param {Array} products - Массив продуктов для экспорта
 */
export const exportToCSV = (products) => {
  // BOM для корректного отображения кириллицы в Excel
  const BOM = '\uFEFF'
  
  // Заголовки CSV
  let csv = BOM + 'Категория;Наименование;Тара мл;Бар 1 (Факт);Бар 2 (Факт);Холод. комната (Факт)\r\n'
  
  // Формирование строк данных
  products.forEach(product => {
    // Экранирование кавычек в текстовых полях
    const category = `"${(product.category_name || 'Без категории').replace(/"/g, '""')}"`
    const name = `"${product.name.replace(/"/g, '""')}"`
    
    // Замена запятой на точку в числах
    const bar1 = (product.bar1 || 0).toString().replace(/,/g, '.')
    const bar2 = (product.bar2 || 0).toString().replace(/,/g, '.')
    const cold_room = (product.cold_room || 0).toString().replace(/,/g, '.')
    
    csv += `${category};${name};${product.volume};${bar1};${bar2};${cold_room}\r\n`
  })
  
  // Создание Blob и скачивание файла
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `стоки_бара_${new Date().toISOString().slice(0, 10)}.csv`
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
