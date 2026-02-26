import React from 'react'
import { formatNumber } from '../utils/format'
import Button from './ui/Button'

const COLUMN_CONFIG = {
  bar1: { label: 'Бар 1', title: 'Бар 1 (Факт)' },
  bar2: { label: 'Бар 2', title: 'Бар 2 (Факт)' },
  cold_room: { label: 'Холод. комната', title: 'Холод. комната (Факт)' }
}

function ProductList({ products, searchQuery, categoryId, availableColumns, onEdit }) {
  const filteredProducts = products.filter(product => {
    if (categoryId !== null && product.category_id !== categoryId) return false
    if (product.is_frozen) return false
    if (availableColumns.includes('bar1') && !availableColumns.includes('bar2')) {
      if (!product.visible_to_bar1) return false
    } else if (availableColumns.includes('bar2') && !availableColumns.includes('bar1')) {
      if (!product.visible_to_bar2) return false
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        product.name.toLowerCase().includes(query) ||
        product.category_name?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const category = product.category_name || 'Без категории'
    if (!acc[category]) acc[category] = []
    acc[category].push(product)
    return acc
  }, {})

  Object.keys(groupedProducts).forEach(category => {
    groupedProducts[category].sort((a, b) => {
      if (a.order_index != null && b.order_index != null) return a.order_index - b.order_index
      return a.id - b.id
    })
  })

  const sortedCategories = Object.keys(groupedProducts).sort((catA, catB) => {
    const orderA = groupedProducts[catA][0]?.category_order_index ?? 99999
    const orderB = groupedProducts[catB][0]?.category_order_index ?? 99999
    return orderA - orderB
  })

  const activeColumns = availableColumns.filter(col => COLUMN_CONFIG[col])

  if (filteredProducts.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600 p-8 text-center text-gray-500 dark:text-gray-400 mb-4 transition-colors">
        <p>Продукты не найдены</p>
      </div>
    )
  }

  return (
    <div className="w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-4 transition-colors">
      <table className="w-full border-collapse table-fixed text-[10px] sm:text-xs md:text-sm">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-900/50 transition-colors">
            <th className="p-1 sm:p-2 text-left font-bold text-gray-700 dark:text-gray-300 border-b-2 border-gray-200 dark:border-gray-700 w-[28%] sm:w-[30%] lg:w-[40%] break-words">Наименование</th>
            <th className="p-1 sm:p-2 text-center font-bold text-gray-700 dark:text-gray-300 border-b-2 border-gray-200 dark:border-gray-700 w-[8%] lg:w-[10%] break-words">Тара, мл</th>
            {activeColumns.map(col => (
              <th key={col} className="p-1 sm:p-2 text-center font-bold text-gray-700 dark:text-gray-300 border-b-2 border-gray-200 dark:border-gray-700 w-[22%] sm:w-[20%] lg:w-auto break-words">
                {COLUMN_CONFIG[col].title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedCategories.map(category => {
            const prods = groupedProducts[category]
            return (
              <React.Fragment key={category}>
                <tr className="bg-gray-50 dark:bg-gray-800/50 transition-colors">
                  <td colSpan={2 + activeColumns.length} className="p-1.5 sm:p-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="font-bold text-gray-900 dark:text-gray-100 text-[11px] sm:text-xs mr-1">{category}</span>
                    <span className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400">({prods.length})</span>
                  </td>
                </tr>
                {prods.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="p-1.5 sm:p-2 border-b border-gray-100 dark:border-gray-700/50 text-gray-800 dark:text-gray-200 truncate">{product.name}</td>
                    <td className="p-1.5 sm:p-2 border-b border-gray-100 dark:border-gray-700/50 text-gray-800 dark:text-gray-200 text-center">{product.volume}</td>
                    {activeColumns.map(col => (
                      <td key={col} className="p-1 sm:p-2 border-b border-gray-100 dark:border-gray-700/50 text-center overflow-visible">
                        <Button
                          onClick={() => onEdit(product, col)}
                          variant="ghost"
                          className="w-full min-h-[34px] sm:min-h-[38px] md:min-h-[44px] px-1 py-1 text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                          title={`Изменить ${COLUMN_CONFIG[col].label}: ${product.name}`}
                        >
                          {formatNumber(product[col])}
                        </Button>
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default ProductList
