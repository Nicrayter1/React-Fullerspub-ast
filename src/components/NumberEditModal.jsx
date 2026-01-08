/**
 * Модальное окно для редактирования чисел
 * Используется для изменения остатков продуктов
 */

import React, { useState, useEffect } from 'react'

const NumberEditModal = ({ isOpen, title, value, onClose, onConfirm }) => {
  const [inputValue, setInputValue] = useState('')

  // Установка начального значения при открытии модалки
  useEffect(() => {
    if (isOpen) {
      const formatted = value !== null && value !== undefined 
        ? value.toString().replace(/,/g, '.') 
        : ''
      setInputValue(formatted)
    }
  }, [isOpen, value])

  /**
   * Обработка изменения значения (замена запятой на точку)
   */
  const handleInputChange = (e) => {
    const val = e.target.value.replace(/,/g, '.')
    setInputValue(val)
  }

  /**
   * Обработка нажатий клавиш
   */
  const handleKeyDown = (e) => {
    // Замена запятой на точку при нажатии
    if (e.key === ',') {
      e.preventDefault()
      const input = e.target
      const start = input.selectionStart
      const end = input.selectionEnd
      const val = input.value
      setInputValue(val.substring(0, start) + '.' + val.substring(end))
      setTimeout(() => input.setSelectionRange(start + 1, start + 1), 0)
    } 
    // Подтверждение по Enter
    else if (e.key === 'Enter') {
      handleConfirm()
    } 
    // Закрытие по Escape
    else if (e.key === 'Escape') {
      onClose()
    }
  }

  /**
   * Подтверждение ввода
   */
  const handleConfirm = () => {
    onConfirm(inputValue)
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
        <h3 className="text-center font-semibold mb-3 dark:text-white">
          {title}
        </h3>
        
        {/* Подсказка */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mb-4">
          Используйте точку для дробей: 0.5 или 1.5
        </p>
        
        {/* Поле ввода */}
        <input
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="0"
          autoFocus
          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-500"
        />
        
        {/* Кнопки действий */}
        <div className="flex gap-2.5 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition"
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

export default NumberEditModal
