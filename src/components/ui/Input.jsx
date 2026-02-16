import React from 'react'

/**
 * Универсальный компонент поля ввода
 */
const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700
          rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
          focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
          transition-all disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-error focus:border-error focus:ring-error/20' : ''}
        `}
        {...props}
      />
      {error && <span className="text-xs text-error ml-1 animate-shake">{error}</span>}
    </div>
  )
}

export default Input
