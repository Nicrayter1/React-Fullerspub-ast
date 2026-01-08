/**
 * Компонент строки продукта в таблице
 * Отображает информацию о продукте и кнопки редактирования
 */

import React from 'react'
import { formatNumber } from '../utils/format'

const ProductRow = ({ product, onEdit }) => {
  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
      {/* Название продукта */}
      <td className="px-1 py-1.5 text-sm dark:text-white">
        {product.name}
      </td>
      
      {/* Объем тары */}
      <td className="px-1 py-1.5 text-sm dark:text-white">
        {product.volume}
      </td>
      
      {/* Кнопки редактирования остатков */}
      {['bar1', 'bar2', 'cold_room'].map((field) => (
        <td key={field} className="px-1 py-1.5 text-center">
          <button
            onClick={() => onEdit(product, field)}
            className="w-full min-h-[30px] px-1 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-blue-500 transition-all dark:text-white"
          >
            {formatNumber(product[field])}
          </button>
        </td>
      ))}
    </tr>
  )
}

export default ProductRow
