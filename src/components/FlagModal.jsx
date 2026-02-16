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
import Modal from './ui/Modal'
import Button from './ui/Button'

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
  
  const actions = (
    <>
      <Button variant="ghost" onClick={onClose}>
        Отмена
      </Button>
      <Button variant="primary" onClick={onSave} className="px-6">
        💾 Сохранить
      </Button>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Флаги для: ${product?.name}`}
      actions={actions}
    >
      <div className="flex flex-col gap-3" onKeyDown={handleKeyDown}>
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
    </Modal>
  )
}

export default FlagModal
