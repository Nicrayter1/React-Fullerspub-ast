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

  // Ошибки валидации
  const [errors, setErrors] = useState({})

  // Сброс полей при открытии
  useEffect(() => {
    if (isOpen) {
      setCategoryName('')
      setSelectedCategoryId('')
      setProductName('')
      setProductVolume('')
      setErrors({})
    }
  }, [isOpen])

  /**
   * Обработка добавления
   */
  const handleAdd = () => {
    const newErrors = {}

    if (type === 'category') {
      if (!categoryName.trim()) {
        newErrors.categoryName = 'Введите название категории'
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }

      setErrors({})
      onAdd({
        name: categoryName.trim()
      })
    } else {
      if (!selectedCategoryId) {
        newErrors.selectedCategoryId = 'Выберите категорию'
      }
      if (!productName.trim()) {
        newErrors.productName = 'Введите название продукта'
      }
      if (!productVolume.trim()) {
        newErrors.productVolume = 'Введите объем'
      } else if (parseInt(productVolume) <= 0) {
        newErrors.productVolume = 'Введите корректный объем'
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }

      setErrors({})
      onAdd({
        category: parseInt(selectedCategoryId),
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
          <div>
            <Input
              label="Название категории"
              type="text"
              value={categoryName}
              onChange={(e) => { setCategoryName(e.target.value); setErrors({}) }}
              onKeyDown={handleKeyDown}
              placeholder="Например: Пиво"
              autoFocus
            />
            {errors.categoryName && (
              <p className="mt-1 text-sm text-red-500">{errors.categoryName}</p>
            )}
          </div>
        )}

        {/* ФОРМА ДЛЯ ПРОДУКТА */}
        {type === 'product' && (
          <>
            <div>
              <Select
                label="Категория"
                value={selectedCategoryId}
                onChange={(e) => { setSelectedCategoryId(e.target.value); setErrors(prev => ({ ...prev, selectedCategoryId: undefined })) }}
                onKeyDown={handleKeyDown}
                options={[
                  { value: '', label: 'Выберите категорию' },
                  ...categories.map((cat) => ({ value: cat.id, label: cat.name }))
                ]}
              />
              {errors.selectedCategoryId && (
                <p className="mt-1 text-sm text-red-500">{errors.selectedCategoryId}</p>
              )}
            </div>

            <div>
              <Input
                label="Название продукта"
                type="text"
                value={productName}
                onChange={(e) => { setProductName(e.target.value); setErrors(prev => ({ ...prev, productName: undefined })) }}
                onKeyDown={handleKeyDown}
                placeholder="Например: Guinness"
              />
              {errors.productName && (
                <p className="mt-1 text-sm text-red-500">{errors.productName}</p>
              )}
            </div>

            <div>
              <Input
                label="Объем тары"
                type="text"
                value={productVolume}
                onChange={(e) => { setProductVolume(e.target.value); setErrors(prev => ({ ...prev, productVolume: undefined })) }}
                onKeyDown={handleKeyDown}
                placeholder="Например: 500 мл"
              />
              {errors.productVolume && (
                <p className="mt-1 text-sm text-red-500">{errors.productVolume}</p>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

export default AddModal
