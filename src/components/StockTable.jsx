/**
 * Основной компонент таблицы остатков
 * Отображает все продукты сгруппированные по категориям
 */

import React from 'react'
import CategorySection from './CategorySection'

const StockTable = ({ products, searchQuery, onEdit }) => {
  /**
   * Фильтрация продуктов по поисковому запросу
   */
  const filteredProducts = products.filter(product => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      product.name.toLowerCase().includes(query) || 
      product.category_name?.toLowerCase().includes(query)
    )
  })

  /**
   * Группировка продуктов по категориям
   */
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const category = product.category_name || 'Без категории'
    if (!acc[category]) acc[category] = []
    acc[category].push(product)
    return acc
  }, {})

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto mb-4">
      <table className="w-full border-collapse min-w-[460px] text-xs">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            <th className="px-1 py-2 text-left font-semibold text-gray-600 dark:text-gray-300 text-xs w-[35%] min-w-[120px]">
              Наименование
            </th>
            <th className="px-1 py-2 text-left font-semibold text-gray-600 dark:text-gray-300 text-xs w-[12%] min-w-[50px]">
              Тара, мл
            </th>
            <th className="px-1 py-2 text-center font-semibold text-gray-600 dark:text-gray-300 text-xs w-[17%] min-w-[60px]">
              Бар 1 (Факт)
            </th>
            <th className="px-1 py-2 text-center font-semibold text-gray-600 dark:text-gray-300 text-xs w-[17%] min-w-[60px]">
              Бар 2 (Факт)
            </th>
            <th className="px-1 py-2 text-center font-semibold text-gray-600 dark:text-gray-300 text-xs w-[17%] min-w-[60px]">
              Холод. комната (Факт)
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Отрисовка категорий с продуктами */}
          {Object.entries(groupedProducts).map(([category, prods]) => (
            <CategorySection
              key={category}
              categoryName={category}
              products={prods}
              onEdit={onEdit}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default StockTable
