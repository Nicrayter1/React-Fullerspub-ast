/**
 * Модальное окно для добавления категорий и продуктов
 */

import React, { useState, useEffect } from 'react'

const AddModal = ({ isOpen, type, categories, onClose, onAdd }) => {
  // Для категории
  const [categoryName, setCategoryName] = useState('')
  
  // Для продукта
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [productName, setProductName] = useState('')
  const [productVolume, setProductVolume] = useState('')

  // Сброс полей при открытии
  useEffect(() => {
    if (isOpen) {
      setCategoryName('')
      setSelectedCategoryId('')
      setProductName('')
      setProductVolume('')
    }
  }, [isOpen])

  /**
   * Обработка добавления
   */
  const handleAdd = () => {
    if (type === 'category') {
      // Добавление категории
      if (!categoryName.trim()) {
        alert('Пожалуйста, введите название категории')
        return
      }
      
      // Передаем название категории как name
      onAdd({ 
        name: categoryName.trim()
      })
      
    } else {
      // Добавление продукта
      if (!selectedCategoryId) {
        alert('Пожалуйста, выберите категорию')
        return
      }
      if (!productName.trim()) {
        alert('Пожалуйста, введите название продукта')
        return
      }
      if (!productVolume || parseInt(productVolume) <= 0) {
        alert('Пожалуйста, введите корректный объем')
        return
      }
      
      // Передаем ID категории (number), а не название
      onAdd({
        category: parseInt(selectedCategoryId), // ID категории
        name: productName.trim(),
        volume: productVolume.trim()
      })
    }
  }

  /**
   * Обработка клавиш
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') onClose()
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl p-5 w-11/12 max-w-sm" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <h3 className="text-center font-semibold mb-4 dark:text-white">
          {type === 'category' ? 'Добавить категорию' : 'Добавить продукт'}
        </h3>

        {/* ФОРМА ДЛЯ КАТЕГОРИИ */}
        {type === 'category' && (
          <div className="mb-3">
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Название категории
            </label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Введите название категории"
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>
        )}

        {/* ФОРМА ДЛЯ ПРОДУКТА */}
        {type === 'product' && (
          <>
            {/* Выбор категории */}
            <div className="mb-3">
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Категория
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Выберите категорию</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Название продукта */}
            <div className="mb-3">
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Название продукта
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Введите название"
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Объем */}
            <div className="mb-3">
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Объем тары
              </label>
              <input
                type="text"
                value={productVolume}
                onChange={(e) => setProductVolume(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Например: 750 мл, 1 л"
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </>
        )}

        {/* Кнопки */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Добавить
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddModal
