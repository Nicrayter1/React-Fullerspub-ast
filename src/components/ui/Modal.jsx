import React from 'react'

/**
 * Универсальный компонент модального окна
 */
const Modal = ({ isOpen, onClose, title, children, actions }) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-heavy overflow-hidden animate-slide-up transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">{title}</h3>
          <button
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>

        {actions && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900/40 flex justify-end gap-3 transition-colors">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
