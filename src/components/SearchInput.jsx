/**
 * Компонент поиска
 * Фильтрует продукты по названию и категории
 */

import React from 'react'
import { Search } from 'lucide-react'

const SearchInput = ({ value, onChange }) => {
  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 pb-4 transition-colors">
      <div className="relative group">
        {/* Иконка поиска */}
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
        
        {/* Поле ввода */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Поиск по названию или категории..."
          className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
        />
      </div>
    </div>
  )
}

export default SearchInput
