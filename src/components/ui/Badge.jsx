import React from 'react'

/**
 * Универсальный компонент бейджа
 */
const Badge = ({ children, variant = 'info', className = '' }) => {
  const variants = {
    info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    error: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    neutral: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variants[variant] || variants.info} ${className}`}>
      {children}
    </span>
  )
}

export default Badge
