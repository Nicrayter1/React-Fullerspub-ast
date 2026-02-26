import React from 'react'
import Button from './ui/Button'

export default function CategoryNav({ categories, activeCategory, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
      <Button
        variant={activeCategory === null ? 'primary' : 'ghost'}
        size="sm"
        className={`rounded-full whitespace-nowrap ${activeCategory !== null ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
        onClick={() => onChange(null)}
      >
        Все
      </Button>
      {categories.map(cat => (
        <Button
          key={cat.id}
          variant={activeCategory === cat.id ? 'primary' : 'ghost'}
          size="sm"
          className={`rounded-full whitespace-nowrap ${activeCategory !== cat.id ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
          onClick={() => onChange(cat.id)}
        >
          {cat.name}
        </Button>
      ))}
    </div>
  )
}
