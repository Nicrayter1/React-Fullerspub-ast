import React from 'react'

/**
 * Универсальный компонент поля ввода
 */
const Input = ({ label, error, icon: Icon, className = '', inputClassName = '', ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
        )}
        <input
          className={`
            w-full py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700
            rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
            transition-all disabled:opacity-50 disabled:cursor-not-allowed
            ${Icon ? 'pl-12 pr-4' : 'px-4'}
            ${error ? 'border-error focus:border-error focus:ring-error/20' : ''}
            ${inputClassName}
          `}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-error ml-1 animate-shake">{error}</span>}
    </div>
  )
}

export default Input
