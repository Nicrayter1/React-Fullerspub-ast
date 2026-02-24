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
 * - Drag & drop для изменения порядка (только внутри категории)
 * - Действия: заморозка, разморозка, удаление
 * - Индикаторы статуса (заморожен/активен)
 * - Управление флагами через кнопку 🏴
 * 
 * @version 3.1.0
 * @author Admin Team
 * @date 2026-02-24
 * ============================================================
 */

import React, { useState } from 'react'
import Button from './ui/Button'
import Badge from './ui/Badge'

/**
 * ============================================================
 * КОМПОНЕНТ СТРОКИ ПРОДУКТА
 * ============================================================
 */
const ProductRow = ({
  product,
  index,
  categoryName,
  isDragging,
  isForbiddenTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onFreeze,
  onUnfreeze,
  onDelete,
  onOpenFlagModal
}) => {
  return (
    <tr
      className={`
        transition-colors border-b border-gray-100 dark:border-gray-700/50
        ${isDragging ? 'bg-primary/5 opacity-50' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'}
        ${product.is_frozen ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}
        ${isForbiddenTarget ? 'bg-red-50/30 dark:bg-red-900/10' : ''}
      `}
      style={{ cursor: isForbiddenTarget ? 'not-allowed' : undefined }}
      draggable={true}
      onDragStart={(e) => onDragStart(e, index, categoryName)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, index, categoryName)}
      onDrop={(e) => onDrop(e, index, categoryName)}
    >
      {/* Drag Handle */}
      <td className="p-2 sm:p-3 text-center w-10 sm:w-12">
        <span
          className="cursor-move text-gray-400 dark:text-gray-600 text-lg sm:text-xl select-none"
          title="Перетащите для изменения порядка"
        >
          ⋮⋮
        </span>
      </td>

      {/* Product Name */}
      <td className="p-2 sm:p-3 text-sm font-medium text-gray-900 dark:text-gray-100">
        <div className="flex items-center gap-2">
          {product.name}
          {product.is_frozen && (
            <Badge variant="info" className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-none">
              ❄️ Заморожен
            </Badge>
          )}
        </div>
      </td>

      {/* Volume */}
      <td className="p-2 sm:p-3 text-sm text-gray-500 dark:text-gray-400">{product.volume}</td>

      {/* Stock Levels */}
      <td className="p-2 sm:p-3 text-center">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md py-1">{product.bar1}</div>
      </td>
      <td className="p-2 sm:p-3 text-center">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md py-1">{product.bar2}</div>
      </td>
      <td className="p-2 sm:p-3 text-center">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md py-1">{product.cold_room}</div>
      </td>

      {/* Actions */}
      <td className="p-2 sm:p-3">
        <div className="flex items-center justify-end gap-1 sm:gap-2">

          {/* Flag Button */}
          <Button
            onClick={() => onOpenFlagModal(product)}
            variant="ghost"
            size="sm"
            className="w-8 h-8 sm:w-10 sm:h-10 p-0 bg-gray-100 dark:bg-gray-700"
            title="Управление флагами"
          >
            <div className="flex gap-0.5 scale-75 sm:scale-100">
              {product.red_flag && <span>🔴</span>}
              {product.green_flag && <span>🟢</span>}
              {product.yellow_flag && <span>🟡</span>}
              {!product.red_flag && !product.green_flag && !product.yellow_flag && (
                <span className="opacity-30">⚪</span>
              )}
            </div>
          </Button>

          {/* Freeze/Unfreeze Button */}
          {!product.is_frozen ? (
            <Button
              onClick={() => onFreeze(product.id)}
              variant="ghost"
              size="sm"
              className="w-8 h-8 sm:w-10 sm:h-10 p-0 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
              title="Заморозить продукт"
            >
              ❄️
            </Button>
          ) : (
            <Button
              onClick={() => onUnfreeze(product.id)}
              variant="ghost"
              size="sm"
              className="w-8 h-8 sm:w-10 sm:h-10 p-0 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
              title="Разморозить продукт"
            >
              🔥
            </Button>
          )}

          {/* Delete Button */}
          <Button
            onClick={() => onDelete(product.id, product.name)}
            variant="ghost"
            size="sm"
            className="w-8 h-8 sm:w-10 sm:h-10 p-0 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            title="Удалить продукт"
          >
            🗑️
          </Button>
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
  onOpenFlagModal
}) => {
  // ============================================================
  // STATE
  // ============================================================

  const [localProducts, setLocalProducts] = useState(products)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [draggedCategory, setDraggedCategory] = useState(null)
  const [hoveredIndex, setHoveredIndex] = useState(null)

  // Обновляем локальное состояние когда меняются products из props
  React.useEffect(() => {
    setLocalProducts(products)
  }, [products])

  // ============================================================
  // DRAG & DROP HANDLERS
  // ============================================================

  const handleDragStart = (e, index, categoryName) => {
    setDraggedIndex(index)
    setDraggedCategory(categoryName)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDraggedCategory(null)
    setHoveredIndex(null)
  }

  const handleDragOver = (e, index, categoryName) => {
    e.preventDefault()

    if (draggedIndex === null || draggedIndex === index) return

    // Запрещаем перетаскивание между категориями
    if (categoryName !== draggedCategory) {
      e.dataTransfer.dropEffect = 'none'
      setHoveredIndex(index)
      return
    }

    e.dataTransfer.dropEffect = 'move'
    setHoveredIndex(null)

    const items = [...localProducts]
    const draggedItem = items[draggedIndex]
    items.splice(draggedIndex, 1)
    items.splice(index, 0, draggedItem)

    setLocalProducts(items)
    setDraggedIndex(index)
  }

  const handleDrop = (e, index, categoryName) => {
    e.preventDefault()
    e.stopPropagation()

    if (draggedIndex === null) return

    // Не сохраняем результат межкатегорийного перетаскивания
    if (categoryName !== draggedCategory) return

    onReorder(localProducts)
  }

  // ============================================================
  // ГРУППИРОВКА ПО КАТЕГОРИЯМ
  // ============================================================

  const groupedProducts = localProducts.reduce((acc, product) => {
    const category = categories.find(c => c.id === product.category_id)
    const categoryName = category ? category.name : 'Без категории'
    if (!acc[categoryName]) acc[categoryName] = []
    acc[categoryName].push(product)
    return acc
  }, {})

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
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700 transition-colors">
        <p className="text-gray-500 dark:text-gray-400">Продукты не найдены</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
      {/* STATISTICS */}
      <div className="flex flex-wrap items-center gap-6 p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-700 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Всего:</span>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{totalProducts}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Активных:</span>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{activeProducts}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Замороженных:</span>
          <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{frozenProducts}</span>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* TABLE HEADER */}
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/20">
              <th className="w-12 p-3 border-b border-gray-200 dark:border-gray-700 transition-colors"></th>
              <th className="p-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 transition-colors">Наименование</th>
              <th className="p-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 transition-colors">Тара, мл</th>
              <th className="p-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 transition-colors w-24 sm:w-32">Бар 1</th>
              <th className="p-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 transition-colors w-24 sm:w-32">Бар 2</th>
              <th className="p-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 transition-colors w-24 sm:w-32">Холодильник</th>
              <th className="p-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 transition-colors w-32 sm:w-48">Действия</th>
            </tr>
          </thead>

          {/* TABLE BODY */}
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {sortedCategories.map(categoryName => {
              const categoryProducts = groupedProducts[categoryName]

              return (
                <React.Fragment key={categoryName}>
                  {/* CATEGORY ROW */}
                  <tr className="bg-gray-50/50 dark:bg-gray-800/80 transition-colors">
                    <td colSpan="7" className="p-3 sm:p-4 border-y border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{categoryName}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">({categoryProducts.length} поз.)</span>
                      </div>
                    </td>
                  </tr>

                  {/* PRODUCT ROWS */}
                  {categoryProducts.map((product) => {
                    const flatIndex = localProducts.indexOf(product)
                    const isForbiddenTarget =
                      draggedCategory !== null &&
                      draggedCategory !== categoryName &&
                      hoveredIndex === flatIndex

                    return (
                      <ProductRow
                        key={product.id}
                        product={product}
                        index={flatIndex}
                        categoryName={categoryName}
                        isDragging={draggedIndex === flatIndex}
                        isForbiddenTarget={isForbiddenTarget}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onFreeze={onFreeze}
                        onUnfreeze={onUnfreeze}
                        onDelete={onDelete}
                        onOpenFlagModal={onOpenFlagModal}
                      />
                    )
                  })}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* HELP TEXT */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-700 transition-colors">
        <p className="text-xs text-gray-500 dark:text-gray-400 italic flex items-center gap-2">
          <span>💡</span> Подсказка: перетащите строки за значок ⋮⋮ для изменения порядка внутри категории
        </p>
      </div>
    </div>
  )
}

export default AdminProductList