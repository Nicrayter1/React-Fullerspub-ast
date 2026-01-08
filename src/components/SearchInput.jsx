/**
 * Компонент поиска
 * Фильтрует продукты по названию и категории
 */

import React from 'react'
import { Search } from 'lucide-react'

const SearchInput = ({ value, onChange }) => {
  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 pb-2">
      <div className="relative">
        {/* Иконка поиска */}
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        
        {/* Поле ввода */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="🔍 Поиск по названию или категории..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-full text-sm bg-gray-50 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  )
}

export default SearchInput
