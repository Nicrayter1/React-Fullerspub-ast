/**
 * Компонент уведомлений
 * Показывает временные уведомления пользователю
 */

import React, { useEffect } from 'react'

const Notification = ({ message, type, onClose }) => {
  // Автоматическое закрытие уведомления через 3 секунды
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 3000)
      return () => clearTimeout(timer)
    }
  }, [message, onClose])

  // Не показываем компонент если нет сообщения
  if (!message) return null

  // Определение цвета фона в зависимости от типа
  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-orange-500'  
  }[type] || 'bg-blue-500'

  return (
    <div className={`fixed top-5 right-5 ${bgColor} text-white px-5 py-3 rounded-lg shadow-lg z-50 text-sm animate-fade-in`}>
      {message}
    </div>
  )
}

export default Notification
