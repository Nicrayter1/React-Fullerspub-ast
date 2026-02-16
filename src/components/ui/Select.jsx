import React from 'react'

/**
 * Универсальный компонент выпадающего списка
 */
const Select = ({ label, options, error, className = '', ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      <select
        className={`
          w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600
          rounded-lg text-sm text-gray-900 dark:text-gray-100 outline-none
          focus:ring-2 focus:ring-primary/20 focus:border-primary
          transition-all disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-error focus:border-error focus:ring-error/20' : ''}
        `}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-error ml-1 animate-shake">{error}</span>}
    </div>
  )
}

export default Select
