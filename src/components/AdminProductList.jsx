/**
 * ============================================================
 * СПИСОК ПРОДУКТОВ ДЛЯ АДМИН-ПАНЕЛИ
 * ============================================================
 * 
 * Компонент для отображения и управления продуктами
 * Поддерживает drag & drop для изменения порядка
 * 
 * ФУНКЦИИ:
 * - Отображение продуктов в виде таблицы
 * - Drag & drop для изменения порядка
 * - Действия: заморозка, разморозка, удаление
 * - Индикаторы статуса (заморожен/активен)
 * 
 * @version 1.0.0
 * @author Admin Team
 * @date 2026-02-05
 * ============================================================
 */

import React, { useState, useRef } from 'react'
import './AdminProductList.css'

/**
 * ============================================================
 * КОМПОНЕНТ ПРОДУКТА
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
  onDelete
}) => {
  const rowRef = useRef(null)

  return (
    <div
      ref={rowRef}
      className={`product-row ${isDragging ? 'dragging' : ''} ${product.is_frozen ? 'frozen' : ''}`}
      draggable={true}
      onDragStart={(e) => onDragStart(e, index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
    >
      {/* Drag Handle */}
      <div className="drag-handle" title="Перетащите для изменения порядка">
        <span>⋮⋮</span>
      </div>

      {/* Order Index */}
      <div className="product-cell order-cell">
        {product.order_index || '-'}
      </div>

      {/* Product Name */}
      <div className="product-cell name-cell">
        <div className="product-name">
          {product.name}
          {product.is_frozen && (
            <span className="frozen-badge" title="Продукт заморожен">❄️</span>
          )}
        </div>
        <div className="product-volume">{product.volume}</div>
      </div>

      {/* Stock Levels */}
      <div className="product-cell stock-cell">
        <span className="stock-label">Bar 1:</span>
        <span className="stock-value">{product.bar1}</span>
      </div>
      <div className="product-cell stock-cell">
        <span className="stock-label">Bar 2:</span>
        <span className="stock-value">{product.bar2}</span>
      </div>
      <div className="product-cell stock-cell">
        <span className="stock-label">Cold Room:</span>
        <span className="stock-value">{product.cold_room}</span>
      </div>

      {/* Visibility Status */}
      <div className="product-cell visibility-cell">
        <div className="visibility-badges">
          {!product.visible_to_bar1 && (
            <span className="visibility-badge hidden" title="Скрыт от Bar 1">
              Bar1 🚫
            </span>
          )}
          {!product.visible_to_bar2 && (
            <span className="visibility-badge hidden" title="Скрыт от Bar 2">
              Bar2 🚫
            </span>
          )}
          {product.visible_to_bar1 && product.visible_to_bar2 && (
            <span className="visibility-badge visible" title="Виден всем">
              ✓ Виден
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="product-cell actions-cell">
        <div className="action-buttons">
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
      </div>
    </div>
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
  onReorder
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
    e.dataTransfer.setData('text/html', e.currentTarget)
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
  // СТАТИСТИКА
  // ============================================================
  
  const totalProducts = products.length
  const frozenProducts = products.filter(p => p.is_frozen).length
  const activeProducts = totalProducts - frozenProducts

  // ============================================================
  // RENDER
  // ============================================================
  
  if (products.length === 0) {
    return null
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

      {/* TABLE HEADER */}
      <div className="product-list-header">
        <div className="header-cell drag-cell"></div>
        <div className="header-cell order-cell">#</div>
        <div className="header-cell name-cell">Название</div>
        <div className="header-cell stock-cell">Bar 1</div>
        <div className="header-cell stock-cell">Bar 2</div>
        <div className="header-cell stock-cell">Cold Room</div>
        <div className="header-cell visibility-cell">Видимость</div>
        <div className="header-cell actions-cell">Действия</div>
      </div>

      {/* PRODUCT ROWS */}
      <div className="product-list-body">
        {localProducts.map((product, index) => (
          <ProductRow
            key={product.id}
            product={product}
            index={index}
            isDragging={draggedIndex === index}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onFreeze={onFreeze}
            onUnfreeze={onUnfreeze}
            onDelete={onDelete}
          />
        ))}
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
