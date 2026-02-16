/**
 * Компонент поиска
 * Фильтрует продукты по названию и категории
 */

import React from 'react'
import { Search } from 'lucide-react'
import Input from './ui/Input'

const SearchInput = ({ value, onChange }) => {
  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 pb-4 transition-colors">
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Поиск по названию или категории..."
        icon={Search}
        className="shadow-sm"
      />
    </div>
  )
}

export default SearchInput
