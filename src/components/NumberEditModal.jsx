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
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-heavy animate-slide-up transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <h3 className="text-center font-bold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>
        
        {/* Подсказка */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mb-6">
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
          className="w-full px-4 py-3 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-lg text-center font-bold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900/50 focus:outline-none focus:border-primary dark:focus:border-primary transition-all"
        />
        
        {/* Кнопки действий */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95"
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-md hover:bg-primary-hover transition-all active:scale-95"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

export default NumberEditModal
