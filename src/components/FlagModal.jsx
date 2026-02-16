/**
 * ============================================================
 * МОДАЛЬНОЕ ОКНО ВЫБОРА ФЛАГОВ
 * ============================================================
 * 
 * Позволяет выбрать флаги для продукта:
 * 🔴 Красный - Стоки (еженедельный учет)
 * 🟢 Зеленый - Ревизия (полная инвентаризация)
 * 🟡 Желтый - Долгая заморозка (архив)
 * 
 * @version 1.0.0
 * @date 2026-02-12
 * ============================================================
 */

import React from 'react'

const FlagModal = ({ isOpen, product, flags, onFlagsChange, onSave, onClose }) => {
  if (!isOpen) return null
  
  /**
   * Обработка изменения флага
   */
  const handleFlagToggle = (flagType) => {
    onFlagsChange({
      ...flags,
      [flagType]: !flags[flagType]
    })
  }
  
  /**
   * Обработка клавиш
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSave()
    if (e.key === 'Escape') onClose()
  }
  
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div 
        className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-heavy overflow-hidden animate-slide-up transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 transition-colors">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">Флаги для: {product?.name}</h3>
          <button
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        {/* Флаги */}
        <div className="p-4 flex flex-col gap-3">
          
          {/* Красный флаг - Стоки */}
          <label className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-all group">
            <input
              type="checkbox"
              checked={flags.red}
              onChange={() => handleFlagToggle('red')}
              className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-2xl group-hover:scale-110 transition-transform">🔴</span>
            <div className="flex-1">
              <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">Стоки</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Еженедельный учет основных позиций
              </div>
            </div>
          </label>
          
          {/* Зеленый флаг - Ревизия */}
          <label className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-all group">
            <input
              type="checkbox"
              checked={flags.green}
              onChange={() => handleFlagToggle('green')}
              className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-2xl group-hover:scale-110 transition-transform">🟢</span>
            <div className="flex-1">
              <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">Ревизия</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Полная инвентаризация всех позиций
              </div>
            </div>
          </label>
          
          {/* Желтый флаг - Долгая заморозка */}
          <label className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-all group">
            <input
              type="checkbox"
              checked={flags.yellow}
              onChange={() => handleFlagToggle('yellow')}
              className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-2xl group-hover:scale-110 transition-transform">🟡</span>
            <div className="flex-1">
              <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">Долгая заморозка</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Архивные и сезонные товары
              </div>
            </div>
          </label>
          
        </div>
        
        {/* Кнопки */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/40 flex justify-end gap-3 transition-colors">
          <button 
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            onClick={onClose}
          >
            Отмена
          </button>
          <button 
            className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2"
            onClick={onSave}
          >
            💾 Сохранить
          </button>
        </div>
      </div>
    </div>
  )
}

export default FlagModal
