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
import './FlagModal.css'

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
      className="flag-modal-overlay" 
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div 
        className="flag-modal-content" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flag-modal-header">
          <h3>Флаги для: {product?.name}</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        
        {/* Флаги */}
        <div className="flag-modal-body">
          
          {/* Красный флаг - Стоки */}
          <label className="flag-option">
            <input
              type="checkbox"
              checked={flags.red}
              onChange={() => handleFlagToggle('red')}
            />
            <span className="flag-icon">🔴</span>
            <div className="flag-info">
              <div className="flag-name">Стоки</div>
              <div className="flag-description">
                Еженедельный учет основных позиций
              </div>
            </div>
          </label>
          
          {/* Зеленый флаг - Ревизия */}
          <label className="flag-option">
            <input
              type="checkbox"
              checked={flags.green}
              onChange={() => handleFlagToggle('green')}
            />
            <span className="flag-icon">🟢</span>
            <div className="flag-info">
              <div className="flag-name">Ревизия</div>
              <div className="flag-description">
                Полная инвентаризация всех позиций
              </div>
            </div>
          </label>
          
          {/* Желтый флаг - Долгая заморозка */}
          <label className="flag-option">
            <input
              type="checkbox"
              checked={flags.yellow}
              onChange={() => handleFlagToggle('yellow')}
            />
            <span className="flag-icon">🟡</span>
            <div className="flag-info">
              <div className="flag-name">Долгая заморозка</div>
              <div className="flag-description">
                Архивные и сезонные товары
              </div>
            </div>
          </label>
          
        </div>
        
        {/* Кнопки */}
        <div className="flag-modal-footer">
          <button 
            className="btn-cancel" 
            onClick={onClose}
          >
            Отмена
          </button>
          <button 
            className="btn-save" 
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
