/**
 * Компонент секции категории
 * Группирует продукты одной категории
 */

import React from 'react'
import ProductRow from './ProductRow'

const CategorySection = ({ categoryName, products, onEdit }) => {
  return (
    <>
      {/* Заголовок категории */}
      <tr className="bg-blue-50 dark:bg-gray-700">
        <td 
          colSpan="5" 
          className="px-2 py-2 font-semibold text-blue-700 dark:text-blue-300 text-sm"
        >
          {categoryName}
        </td>
      </tr>
      
      {/* Продукты категории */}
      {products.map((product) => (
        <ProductRow 
          key={product.id} 
          product={product} 
          onEdit={onEdit} 
        />
      ))}
    </>
  )
}

export default CategorySection
