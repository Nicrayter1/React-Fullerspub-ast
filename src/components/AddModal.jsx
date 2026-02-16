/**
 * Модальное окно для добавления категорий и продуктов
 */

import React, { useState, useEffect } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Input from './ui/Input'
import Select from './ui/Select'

const AddModal = ({ isOpen, type, categories, onClose, onAdd }) => {
  // Для категории
  const [categoryName, setCategoryName] = useState('')
  
  // Для продукта
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [productName, setProductName] = useState('')
  const [productVolume, setProductVolume] = useState('')

  // Сброс полей при открытии
  useEffect(() => {
    if (isOpen) {
      setCategoryName('')
      setSelectedCategoryId('')
      setProductName('')
      setProductVolume('')
    }
  }, [isOpen])

  /**
   * Обработка добавления
   */
  const handleAdd = () => {
    if (type === 'category') {
      // Добавление категории
      if (!categoryName.trim()) {
        alert('Пожалуйста, введите название категории')
        return
      }
      
      // Передаем название категории как name
      onAdd({ 
        name: categoryName.trim()
      })
      
    } else {
      // Добавление продукта
      if (!selectedCategoryId) {
        alert('Пожалуйста, выберите категорию')
        return
      }
      if (!productName.trim()) {
        alert('Пожалуйста, введите название продукта')
        return
      }
      if (!productVolume || parseInt(productVolume) <= 0) {
        alert('Пожалуйста, введите корректный объем')
        return
      }
      
      // Передаем ID категории (number), а не название
      onAdd({
        category: parseInt(selectedCategoryId), // ID категории
        name: productName.trim(),
        volume: productVolume.trim()
      })
    }
  }

  /**
   * Обработка клавиш
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') onClose()
  }

  const actions = (
    <>
      <Button variant="ghost" className="flex-1 bg-gray-100 dark:bg-gray-700" onClick={onClose}>
        Отмена
      </Button>
      <Button variant="primary" className="flex-1" onClick={handleAdd}>
        Добавить
      </Button>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'category' ? '📁 Добавить категорию' : '📦 Добавить продукт'}
      actions={actions}
    >
      <div className="flex flex-col gap-4">
        {/* ФОРМА ДЛЯ КАТЕГОРИИ */}
        {type === 'category' && (
          <Input
            label="Название категории"
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Например: Пиво"
            autoFocus
          />
        )}

        {/* ФОРМА ДЛЯ ПРОДУКТА */}
        {type === 'product' && (
          <>
            <Select
              label="Категория"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              onKeyDown={handleKeyDown}
              options={[
                { value: '', label: 'Выберите категорию' },
                ...categories.map((cat) => ({ value: cat.id, label: cat.name }))
              ]}
            />

            <Input
              label="Название продукта"
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Например: Guinness"
            />

            <Input
              label="Объем тары"
              type="text"
              value={productVolume}
              onChange={(e) => setProductVolume(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Например: 500 мл"
            />
          </>
        )}
      </div>
    </Modal>
  )
}

export default AddModal
