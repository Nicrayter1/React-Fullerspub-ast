import React from 'react'

/**
 * Универсальный компонент карточки
 */
const Card = ({ title, children, actions, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors ${className}`}>
      {(title || actions) && (
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          {title && <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>}
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

export default Card
