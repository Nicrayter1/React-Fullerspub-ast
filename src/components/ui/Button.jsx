import React from 'react'

/**
 * Универсальный компонент кнопки
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  const variants = {
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-md',
    secondary: 'bg-secondary hover:bg-secondary-hover text-white shadow-sm',
    success: 'bg-success hover:bg-success-hover text-white shadow-md',
    error: 'bg-error hover:bg-error-hover text-white shadow-md',
    warning: 'bg-warning hover:bg-warning-hover text-white shadow-md',
    info: 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-md',
    outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary/10',
    danger: 'bg-error/20 hover:bg-error/30 border border-error/30 text-error-hover',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-xl font-bold transition-all
        active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${className}
      `}
      {...props}
    >
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>}
      {!loading && Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
      {children}
    </button>
  )
}

export default Button
