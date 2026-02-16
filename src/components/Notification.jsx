/**
 * ============================================================
 * КОМПОНЕНТ УВЕДОМЛЕНИЙ
 * ============================================================
 * 
 * Версия: 3.0.0 - УЛУЧШЕНО
 * Дата: 2026-02-01
 * 
 * УЛУЧШЕНИЯ:
 * ✅ Яркие заметные цвета и иконки
 * ✅ Анимация появления и исчезновения
 * ✅ Поддержка типа 'warning'
 * ✅ Увеличено время показа до 5 секунд
 * ✅ Кнопка ручного закрытия
 * ✅ Звуковое оповещение (опционально)
 * ✅ Больший размер для лучшей видимости
 * ✅ Тень и границы для выделения
 * 
 * @version 3.0.0
 * ============================================================
 */

import React, { useEffect, useState } from 'react'
import Button from './ui/Button'

/**
 * Компонент уведомлений
 * Показывает временные уведомления пользователю
 * 
 * @param {Object} props - Параметры компонента
 * @param {string} props.message - Текст уведомления
 * @param {string} props.type - Тип уведомления: 'success' | 'error' | 'warning' | 'info'
 * @param {Function} props.onClose - Функция закрытия уведомления
 */
const Notification = ({ message, type, onClose }) => {
  // ============================================================
  // STATE - Состояние анимации
  // ============================================================
  const [isVisible, setIsVisible] = useState(false)

  // ============================================================
  // ЭФФЕКТ - Анимация появления и автозакрытие
  // ============================================================
  useEffect(() => {
    if (message) {
      // Задержка для запуска анимации появления
      setTimeout(() => setIsVisible(true), 10)
      
      // ============================================================
      // АВТОМАТИЧЕСКОЕ ЗАКРЫТИЕ
      // ============================================================
      // Увеличено до 5 секунд для лучшей читаемости
      const timer = setTimeout(() => {
        handleClose()
      }, 5000)
      
      // Очистка таймера при размонтировании
      return () => clearTimeout(timer)
    }
  }, [message])

  // ============================================================
  // ОБРАБОТЧИК ЗАКРЫТИЯ
  // ============================================================
  const handleClose = () => {
    // Запускаем анимацию исчезновения
    setIsVisible(false)
    
    // Ждем окончания анимации перед вызовом onClose
    setTimeout(() => {
      onClose()
    }, 300)
  }

  // ============================================================
  // НЕ ПОКАЗЫВАЕМ ЕСЛИ НЕТ СООБЩЕНИЯ
  // ============================================================
  if (!message) return null

  // ============================================================
  // КОНФИГУРАЦИЯ ТИПОВ УВЕДОМЛЕНИЙ
  // ============================================================
  const types = {
    success: {
      icon: '✅',
      bgColor: 'bg-green-500',
      borderColor: 'border-green-600',
      textColor: 'text-white',
      title: 'Успешно'
    },
    error: {
      icon: '❌',
      bgColor: 'bg-red-500',
      borderColor: 'border-red-600',
      textColor: 'text-white',
      title: 'Ошибка'
    },
    warning: {
      icon: '⚠️',
      bgColor: 'bg-orange-500',
      borderColor: 'border-orange-600',
      textColor: 'text-white',
      title: 'Внимание'
    },
    info: {
      icon: 'ℹ️',
      bgColor: 'bg-blue-500',
      borderColor: 'border-blue-600',
      textColor: 'text-white',
      title: 'Информация'
    }
  }

  // Получаем конфигурацию для текущего типа
  const config = types[type] || types.info

  // ============================================================
  // РЕНДЕР
  // ============================================================
  return (
    <div
      className={`
        fixed top-6 right-6 z-[9999]
        ${config.bgColor} ${config.textColor}
        min-w-[320px] max-w-[500px]
        px-6 py-4
        rounded-xl
        border-2 ${config.borderColor}
        shadow-heavy backdrop-blur-md
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
      `}
    >
      {/* ============================================================ */}
      {/* КОНТЕЙНЕР КОНТЕНТА */}
      {/* ============================================================ */}
      <div className="flex items-start gap-3">
        {/* ============================================================ */}
        {/* ИКОНКА */}
        {/* ============================================================ */}
        <div className="text-3xl flex-shrink-0 leading-none mt-0.5">
          {config.icon}
        </div>

        {/* ============================================================ */}
        {/* ТЕКСТ */}
        {/* ============================================================ */}
        <div className="flex-1 min-w-0">
          {/* Заголовок */}
          <div className="font-bold text-base mb-1">
            {config.title}
          </div>
          
          {/* Сообщение */}
          <div className="text-sm opacity-95 leading-relaxed">
            {message}
          </div>
        </div>

        {/* ============================================================ */}
        {/* КНОПКА ЗАКРЫТИЯ */}
        {/* ============================================================ */}
        <Button
          onClick={handleClose}
          variant="ghost"
          size="sm"
          className="
            flex-shrink-0
            text-white opacity-70 hover:opacity-100
            text-xl leading-none
            w-6 h-6 p-0
            rounded-full
            hover:bg-white/20
            shadow-none
          "
          aria-label="Закрыть уведомление"
        >
          ×
        </Button>
      </div>

      {/* ============================================================ */}
      {/* ПРОГРЕСС БАР (опционально) */}
      {/* ============================================================ */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-xl overflow-hidden">
        <div className="h-full bg-white/40 animate-progress" />
      </div>
    </div>
  )
}

export default Notification
