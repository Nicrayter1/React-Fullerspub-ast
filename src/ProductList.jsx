import React from 'react'
import { formatNumber } from './utils/format'
import './ProductList.css'

// ============================================
// КОНФИГУРАЦИЯ КОЛОНОК
// ============================================

/**
 * Конфигурация колонок для отображения
 * 
 * Каждая колонка имеет:
 *  - label: Короткое название для UI
 *  - title: Полное название для заголовка таблицы
 */
const COLUMN_CONFIG = {
  bar1: { label: 'Бар 1', title: 'Бар 1 (Факт)' },
  bar2: { label: 'Бар 2', title: 'Бар 2 (Факт)' },
  cold_room: { label: 'Холод. комната', title: 'Холод. комната (Факт)' }
}

// ============================================
// ГЛАВНЫЙ КОМПОНЕНТ
// ============================================

/**
 * Компонент таблицы продуктов
 * 
 * Props:
 *  @param {Array} products - Массив продуктов из БД
 *  @param {string} searchQuery - Поисковый запрос для фильтрации
 *  @param {number|null} categoryId - ID категории для фильтрации (null = все)
 *  @param {Array} availableColumns - Доступные колонки для роли пользователя
 *  @param {Function} onEdit - Callback для редактирования значения
 * 
 * Пример использования:
 *  <ProductList 
 *    products={products}
 *    searchQuery={search}
 *    categoryId={selectedCategory}
 *    availableColumns={['bar1', 'cold_room']}
 *    onEdit={(product, column) => handleEdit(product, column)}
 *  />
 */
function ProductList({ products, searchQuery, categoryId, availableColumns, onEdit }) {
  
  // ============================================
  // ФИЛЬТРАЦИЯ ПРОДУКТОВ
  // ============================================
  
  /**
   * Фильтрация продуктов по поисковому запросу и категории
   * 
   * Применяет фильтры:
   *  1. По категории (если выбрана конкретная категория)
   *  2. По заморозке (скрываем замороженные продукты)
   *  3. По видимости (проверяем visible_to_bar1/bar2)
   *  4. По поисковому запросу (имя продукта или категории)
   * 
   * @returns {Array} Отфильтрованный массив продуктов
   */
  const filteredProducts = products.filter(product => {
    // Фильтр #1: По категории
    if (categoryId !== null && product.category_id !== categoryId) {
      return false
    }

    // Фильтр #2: Скрываем замороженные продукты
    if (product.is_frozen) {
      return false
    }

    // Фильтр #3: По видимости для текущего бара
    // Определяем какие колонки доступны пользователю
    if (availableColumns.includes('bar1') && !availableColumns.includes('bar2')) {
      // Только bar1 - проверяем visible_to_bar1
      if (!product.visible_to_bar1) {
        return false
      }
    } else if (availableColumns.includes('bar2') && !availableColumns.includes('bar1')) {
      // Только bar2 - проверяем visible_to_bar2
      if (!product.visible_to_bar2) {
        return false
      }
    }
    // Для менеджера (все колонки) - показываем все незамороженные

    // Фильтр #4: По поисковому запросу
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        product.name.toLowerCase().includes(query) ||
        product.category_name?.toLowerCase().includes(query)
      )
    }

    return true
  })

  // ============================================
  // ГРУППИРОВКА И СОРТИРОВКА
  // ============================================

  /**
   * Группировка продуктов по категориям с сортировкой
   * 
   * ВАЖНО: Сортировка происходит в два этапа:
   *  1. Продукты сортируются по order_index внутри каждой категории
   *  2. Категории сортируются по минимальному order_index продуктов в них
   * 
   * @returns {Object} Объект вида { categoryName: [sortedProducts] }
   */
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const category = product.category_name || 'Без категории'
    
    if (!acc[category]) {
      acc[category] = []
    }
    
    acc[category].push(product)
    return acc
  }, {})

  /**
   * Сортировка продуктов внутри каждой категории
   * 
   * Сортирует по order_index (если есть) или по ID (как fallback)
   */
  Object.keys(groupedProducts).forEach(category => {
    groupedProducts[category].sort((a, b) => {
      // Если order_index есть - используем его
      if (a.order_index != null && b.order_index != null) {
        return a.order_index - b.order_index
      }
      
      // Если order_index нет - сортируем по ID (как fallback)
      return a.id - b.id
    })
  })

  /**
   * Сортировка категорий по порядку
   * 
   * Сортируем по минимальному order_index продуктов в категории
   * Это гарантирует что категории идут в правильном порядке
   */
  const sortedCategories = Object.keys(groupedProducts).sort((catA, catB) => {
    const productsA = groupedProducts[catA]
    const productsB = groupedProducts[catB]
    
    // Находим минимальный order_index в каждой категории
    const minOrderA = Math.min(...productsA.map(p => p.order_index || p.id))
    const minOrderB = Math.min(...productsB.map(p => p.order_index || p.id))
    
    return minOrderA - minOrderB
  })

  // ============================================
  // ПОДГОТОВКА КОЛОНОК
  // ============================================

  /**
   * Активные колонки для отображения
   * 
   * Фильтрует только те колонки которые:
   *  1. Доступны пользователю (из availableColumns)
   *  2. Есть в COLUMN_CONFIG
   */
  const activeColumns = availableColumns.filter(col => COLUMN_CONFIG[col])

  // ============================================
  // РЕНДЕРИНГ: Пустое состояние
  // ============================================

  /**
   * Если продукты не найдены - показываем сообщение
   */
  if (filteredProducts.length === 0) {
    return (
      <div className="product-list-empty">
        <p>Продукты не найдены</p>
      </div>
    )
  }

  // ============================================
  // РЕНДЕРИНГ: Таблица продуктов
  // ============================================

  return (
    <div className="product-list">
      <table className="product-table">
        
        {/* ===== ЗАГОЛОВОК ТАБЛИЦЫ ===== */}
        <thead>
          <tr>
            <th className="col-name">Наименование</th>
            <th className="col-volume">Тара, мл</th>
            
            {/* Колонки для каждого доступного склада */}
            {activeColumns.map(col => (
              <th key={col} className="col-stock">
                {COLUMN_CONFIG[col].title}
              </th>
            ))}
          </tr>
        </thead>

        {/* ===== ТЕЛО ТАБЛИЦЫ ===== */}
        <tbody>
          {/* Проходим по категориям В ПРАВИЛЬНОМ ПОРЯДКЕ */}
          {sortedCategories.map(category => {
            const prods = groupedProducts[category]
            
            return (
              <React.Fragment key={category}>
                
                {/* ===== СТРОКА КАТЕГОРИИ ===== */}
                <tr className="category-row">
                  <td colSpan={2 + activeColumns.length}>
                    <span className="category-name">{category}</span>
                    <span className="category-count">({prods.length})</span>
                  </td>
                </tr>

                {/* ===== СТРОКИ ПРОДУКТОВ ===== */}
                {/* Продукты УЖЕ отсортированы по order_index */}
                {prods.map(product => (
                  <tr key={product.id} className="product-row">
                    
                    {/* Название продукта */}
                    <td className="col-name">{product.name}</td>
                    
                    {/* Объем тары */}
                    <td className="col-volume">{product.volume}</td>
                    
                    {/* Значения для каждого склада */}
                    {activeColumns.map(col => (
                      <td key={col} className="col-stock">
                        <button
                          onClick={() => onEdit(product, col)}
                          className="stock-button"
                          title={`Изменить ${COLUMN_CONFIG[col].label}: ${product.name}`}
                        >
                          {formatNumber(product[col])}
                        </button>
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
