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
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-heavy animate-slide-up transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <h3 className="text-center font-bold text-gray-900 dark:text-gray-100 mb-6">
          {type === 'category' ? '📁 Добавить категорию' : '📦 Добавить продукт'}
        </h3>

        {/* ФОРМА ДЛЯ КАТЕГОРИИ */}
        {type === 'category' && (
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
              Название категории
            </label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Например: Пиво"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary transition-all"
              autoFocus
            />
          </div>
        )}

        {/* ФОРМА ДЛЯ ПРОДУКТА */}
        {type === 'product' && (
          <div className="flex flex-col gap-4">
            {/* Выбор категории */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
                Категория
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary transition-all"
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
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
                Название продукта
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Например: Guinness"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary transition-all"
              />
            </div>

            {/* Объем */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
                Объем тары
              </label>
              <input
                type="text"
                value={productVolume}
                onChange={(e) => setProductVolume(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Например: 500 мл"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
        )}

        {/* Кнопки */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95"
          >
            Отмена
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-md hover:bg-primary-hover transition-all active:scale-95"
          >
            Добавить
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddModal
