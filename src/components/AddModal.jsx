/**
 * Модальное окно для добавления категорий и продуктов
 */

import React, { useState, useEffect } from 'react'

const AddModal = ({ isOpen, type, categories, onClose, onAdd }) => {
  const [category, setCategory] = useState('')
  const [name, setName] = useState('')
  const [volume, setVolume] = useState('')

  // Сброс полей при открытии
  useEffect(() => {
    if (isOpen) {
      setCategory('')
      setName('')
      setVolume('')
    }
  }, [isOpen])

  /**
   * Обработка добавления элемента
   */
  const handleAdd = () => {
    // Валидация категории
    if (!category.trim()) {
      alert('Пожалуйста, выберите категорию')
      return
    }

    // Валидация для продукта
    if (type === 'product') {
      if (!name.trim()) {
        alert('Пожалуйста, введите название продукта')
        return
      }
      if (!volume || volume <= 0) {
        alert('Пожалуйста, введите корректный объем')
        return
      }
    }

    onAdd({ category, name, volume: parseInt(volume) || 0 })
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

        {/* Выбор категории */}
        <div className="mb-3">
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Категория
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Выберите категорию</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Поля для продукта */}
        {type === 'product' && (
          <>
            {/* Название продукта */}
            <div className="mb-3">
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Название продукта
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Введите название"
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Объем */}
            <div className="mb-3">
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Объем (мл)
              </label>
              <input
                type="number"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Введите объем"
                min="0"
                step="1"
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </>
        )}

        {/* Кнопки действий */}
        <div className="flex gap-2.5 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition"
          >
            Отмена
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 py-2.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition"
          >
            Добавить
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddModal
