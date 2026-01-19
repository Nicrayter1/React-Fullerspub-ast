/**
 * Компонент списка продуктов
 * Отображает продукты с учетом роли пользователя
 */

import React from 'react'
import { formatNumber } from './utils/format'
import './ProductList.css'

// Конфигурация колонок
const COLUMN_CONFIG = {
  bar1: { label: 'Бар 1', title: 'Бар 1 (Факт)' },
  bar2: { label: 'Бар 2', title: 'Бар 2 (Факт)' },
  cold_room: { label: 'Холод. комната', title: 'Холод. комната (Факт)' }
}

/**
 * Компонент таблицы продуктов с фильтрацией по категории и роли
 */
function ProductList({ products, searchQuery, categoryId, availableColumns, onEdit }) {
  /**
   * Фильтрация продуктов по поисковому запросу и категории
   */
  const filteredProducts = products.filter(product => {
    // Фильтр по категории
    if (categoryId !== null && product.category_id !== categoryId) {
      return false
    }

    // Фильтр по поисковому запросу
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        product.name.toLowerCase().includes(query) ||
        product.category_name?.toLowerCase().includes(query)
      )
    }

    return true
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

  // Активные колонки для отображения
  const activeColumns = availableColumns.filter(col => COLUMN_CONFIG[col])

  if (filteredProducts.length === 0) {
    return (
      <div className="product-list-empty">
        <p>Продукты не найдены</p>
      </div>
    )
  }

  return (
    <div className="product-list">
      <table className="product-table">
        <thead>
          <tr>
            <th className="col-name">Наименование</th>
            <th className="col-volume">Тара, мл</th>
            {activeColumns.map(col => (
              <th key={col} className="col-stock">
                {COLUMN_CONFIG[col].title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedProducts).map(([category, prods]) => (
            <React.Fragment key={category}>
              {/* Заголовок категории */}
              <tr className="category-row">
                <td colSpan={2 + activeColumns.length}>
                  <span className="category-name">{category}</span>
                  <span className="category-count">({prods.length})</span>
                </td>
              </tr>

              {/* Продукты в категории */}
              {prods.map(product => (
                <tr key={product.id} className="product-row">
                  <td className="col-name">{product.name}</td>
                  <td className="col-volume">{product.volume}</td>
                  {activeColumns.map(col => (
                    <td key={col} className="col-stock">
                      <button
                        onClick={() => onEdit(product, col)}
                        className="stock-button"
                      >
                        {formatNumber(product[col])}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ProductList
