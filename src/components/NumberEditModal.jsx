/**
 * Модальное окно для редактирования чисел
 * Используется для изменения остатков продуктов
 */

import React, { useState, useEffect } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Input from './ui/Input'

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

  const actions = (
    <>
      <Button variant="ghost" className="flex-1 bg-gray-100 dark:bg-gray-700" onClick={onClose}>
        Отмена
      </Button>
      <Button variant="primary" className="flex-1" onClick={handleConfirm}>
        OK
      </Button>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      actions={actions}
    >
      <div className="flex flex-col items-center">
        {/* Подсказка */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mb-6">
          Используйте точку для дробей: 0.5 или 1.5
        </p>
        
        {/* Поле ввода */}
        <Input
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="0"
          autoFocus
          className="w-full"
          inputClassName="text-lg text-center font-bold"
        />
      </div>
    </Modal>
  )
}

export default NumberEditModal
