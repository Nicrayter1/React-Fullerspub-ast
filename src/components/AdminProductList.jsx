/**
 * ============================================================
 * СПИСОК ПРОДУКТОВ ДЛЯ АДМИН-ПАНЕЛИ
 * ============================================================
 * 
 * Компонент для отображения и управления продуктами
 * Поддерживает drag & drop для изменения порядка
 * Использует ТЕМНУЮ ТЕМУ как в основном приложении
 * 
 * ФУНКЦИИ:
 * - Отображение продуктов в темной теме
 * - Drag & drop для изменения порядка
 * - Действия: заморозка, разморозка, удаление
 * - Индикаторы статуса (заморожен/активен)
 * - НОВОЕ: Управление флагами через кнопку 🏴
 * 
 * @version 3.0.0
 * @author Admin Team
 * @date 2026-02-12
 * ============================================================
 */

import React, { useState } from 'react'
import './AdminProductList.css'

/**
 * ============================================================
 * КОМПОНЕНТ СТРОКИ ПРОДУКТА
 * ============================================================
 */
const ProductRow = ({
  product,
  index,
  isDragging,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onFreeze,
  onUnfreeze,
  onDelete,
  onOpenFlagModal  // НОВОЕ: функция открытия модалки флагов
}) => {
  return (
    <tr
      className={`product-row ${isDragging ? 'dragging' : ''} ${product.is_frozen ? 'frozen-product' : ''}`}
      draggable={true}
      onDragStart={(e) => onDragStart(e, index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
    >
      {/* Drag Handle */}
      <td className="drag-handle-cell">
        <span className="drag-handle" title="Перетащите для изменения порядка">⋮⋮</span>
      </td>

      {/* Product Name */}
      <td className="col-name">
        {product.name}
        {product.is_frozen && (
          <span className="frozen-badge" title="Продукт заморожен"> ❄️</span>
        )}
      </td>

      {/* Volume */}
      <td className="col-volume">{product.volume}</td>

      {/* Stock Levels */}
      <td className="col-stock">
        <div className="stock-display">{product.bar1}</div>
      </td>
      <td className="col-stock">
        <div className="stock-display">{product.bar2}</div>
      </td>
      <td className="col-stock">
        <div className="stock-display">{product.cold_room}</div>
      </td>

      {/* Actions */}
      <td className="col-actions">
        <div className="action-buttons">
          
          {/* НОВОЕ: Flag Button - Кнопка управления флагами */}
          <button
            onClick={() => onOpenFlagModal(product)}
            className="btn-action btn-flag"
            title="Управление флагами"
          >
            <span className="flag-icons">
              {product.red_flag && <span className="flag-red">🔴</span>}
              {product.green_flag && <span className="flag-green">🟢</span>}
              {product.yellow_flag && <span className="flag-yellow">🟡</span>}
              {!product.red_flag && !product.green_flag && !product.yellow_flag && (
                <span className="flag-empty">⚪</span>
              )}
            </span>
          </button>

          {/* Freeze/Unfreeze Button */}
          {!product.is_frozen ? (
            <button
              onClick={() => onFreeze(product.id)}
              className="btn-action btn-freeze"
              title="Заморозить продукт"
            >
              ❄️
            </button>
          ) : (
            <button
              onClick={() => onUnfreeze(product.id)}
              className="btn-action btn-unfreeze"
              title="Разморозить продукт"
            >
              🔥
            </button>
          )}

          {/* Delete Button */}
          <button
            onClick={() => onDelete(product.id, product.name)}
            className="btn-action btn-delete"
            title="Удалить продукт"
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  )
}

/**
 * ============================================================
 * ГЛАВНЫЙ КОМПОНЕНТ СПИСКА ПРОДУКТОВ
 * ============================================================
 */
const AdminProductList = ({
  products,
  categories,
  onFreeze,
  onUnfreeze,
  onDelete,
  onReorder,
  onOpenFlagModal  // НОВОЕ: prop для открытия модалки флагов
}) => {
  // ============================================================
  // STATE
  // ============================================================
  
  const [localProducts, setLocalProducts] = useState(products)
  const [draggedIndex, setDraggedIndex] = useState(null)

  // Обновляем локальное состояние когда меняются products из props
  React.useEffect(() => {
    setLocalProducts(products)
  }, [products])

  // ============================================================
  // DRAG & DROP HANDLERS
  // ============================================================
  
  /**
   * Начало перетаскивания
   */
  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  /**
   * Конец перетаскивания
   */
  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  /**
   * Перетаскивание над элементом
   */
  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    if (draggedIndex === null || draggedIndex === index) {
      return
    }

    // Создаем копию массива
    const items = [...localProducts]
    const draggedItem = items[draggedIndex]

    // Удаляем из старой позиции
    items.splice(draggedIndex, 1)
    // Вставляем в новую позицию
    items.splice(index, 0, draggedItem)

    setLocalProducts(items)
    setDraggedIndex(index)
  }

  /**
   * Отпускание элемента
   */
  const handleDrop = (e, index) => {
    e.preventDefault()
    e.stopPropagation()

    if (draggedIndex === null) {
      return
    }

    // Вызываем колбэк для сохранения в базе данных
    onReorder(localProducts)
  }

  // ============================================================
  // ГРУППИРОВКА ПО КАТЕГОРИЯМ
  // ============================================================
  
  // Группируем продукты по категориям
  const groupedProducts = localProducts.reduce((acc, product) => {
    const categoryId = product.category_id
    const category = categories.find(c => c.id === categoryId)
    const categoryName = category ? category.name : 'Без категории'
    
    if (!acc[categoryName]) {
      acc[categoryName] = []
    }
    acc[categoryName].push(product)
    return acc
  }, {})

  // Сортируем категории по order_index
  const sortedCategories = Object.keys(groupedProducts).sort((a, b) => {
    const catA = categories.find(c => c.name === a)
    const catB = categories.find(c => c.name === b)
    return (catA?.order_index || 999) - (catB?.order_index || 999)
  })

  // ============================================================
  // СТАТИСТИКА
  // ============================================================
  
  const totalProducts = products.length
  const frozenProducts = products.filter(p => p.is_frozen).length
  const activeProducts = totalProducts - frozenProducts

  // ============================================================
  // RENDER
  // ============================================================
  
  if (products.length === 0) {
    return (
      <div className="admin-product-list-empty">
        <p>Продукты не найдены</p>
      </div>
    )
  }

  return (
    <div className="admin-product-list">
      {/* STATISTICS */}
      <div className="product-list-stats">
        <div className="stat-item">
          <span className="stat-label">Всего:</span>
          <span className="stat-value">{totalProducts}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Активных:</span>
          <span className="stat-value success">{activeProducts}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Замороженных:</span>
          <span className="stat-value warning">{frozenProducts}</span>
        </div>
      </div>

      {/* TABLE */}
      <div className="product-table-container">
        <table className="product-table">
          {/* TABLE HEADER */}
          <thead>
            <tr>
              <th className="drag-handle-header"></th>
              <th className="col-name">Наименование</th>
              <th className="col-volume">Тара, мл</th>
              <th className="col-stock">Бар 1 (Факт)</th>
              <th className="col-stock">Бар 2 (Факт)</th>
              <th className="col-stock">Холод. комната (Факт)</th>
              <th className="col-actions">Действия</th>
            </tr>
          </thead>

          {/* TABLE BODY */}
          <tbody>
            {sortedCategories.map(categoryName => {
              const categoryProducts = groupedProducts[categoryName]
              
              return (
                <React.Fragment key={categoryName}>
                  {/* CATEGORY ROW */}
                  <tr className="category-row">
                    <td colSpan="7">
                      <span className="category-name">{categoryName}</span>
                      <span className="category-count">({categoryProducts.length})</span>
                    </td>
                  </tr>

                  {/* PRODUCT ROWS */}
                  {categoryProducts.map((product, index) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      index={localProducts.indexOf(product)}
                      isDragging={draggedIndex === localProducts.indexOf(product)}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onFreeze={onFreeze}
                      onUnfreeze={onUnfreeze}
                      onDelete={onDelete}
                      onOpenFlagModal={onOpenFlagModal}
                    />
                  ))}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* HELP TEXT */}
      <div className="product-list-footer">
        <p className="help-text">
          💡 Подсказка: перетащите строки для изменения порядка продуктов
        </p>
      </div>
    </div>
  )
}

export default AdminProductList
