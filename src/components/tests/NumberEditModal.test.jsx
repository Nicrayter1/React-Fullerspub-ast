import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import NumberEditModal from '../NumberEditModal'

describe('NumberEditModal component', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Редактировать количество',
    value: 5,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  }

  it('компонент не рендерится при isOpen=false', () => {
    render(<NumberEditModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText(defaultProps.title)).not.toBeInTheDocument()
  })

  it('компонент рендерится при isOpen=true', () => {
    render(<NumberEditModal {...defaultProps} />)
    expect(screen.getByText(defaultProps.title)).toBeInTheDocument()
  })

  it('отображает переданное значение в поле ввода', () => {
    render(<NumberEditModal {...defaultProps} value={10.5} />)
    const input = screen.getByRole('textbox')
    expect(input.value).toBe('10.5')
  })

  it('заменяет запятую на точку при вводе', () => {
    render(<NumberEditModal {...defaultProps} />)
    const input = screen.getByRole('textbox')

    fireEvent.change(input, { target: { value: '1,5' } })
    expect(input.value).toBe('1.5')
  })

  it('вызывает onConfirm с введенным значением при клике на "OK"', () => {
    const onConfirm = vi.fn()
    render(<NumberEditModal {...defaultProps} onConfirm={onConfirm} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '7.5' } })

    fireEvent.click(screen.getByText('OK'))
    expect(onConfirm).toHaveBeenCalledWith('7.5')
  })

  it('вызывает onClose при клике на "Отмена"', () => {
    const onClose = vi.fn()
    render(<NumberEditModal {...defaultProps} onClose={onClose} />)

    fireEvent.click(screen.getByText('Отмена'))
    expect(onClose).toHaveBeenCalled()
  })

  it('закрытие по клавише Escape', () => {
    const onClose = vi.fn()
    render(<NumberEditModal {...defaultProps} onClose={onClose} />)

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('подтверждение по клавише Enter', () => {
    const onConfirm = vi.fn()
    render(<NumberEditModal {...defaultProps} onConfirm={onConfirm} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '12' } })

    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onConfirm).toHaveBeenCalledWith('12')
  })

  it('заменяет запятую на точку при нажатии клавиши ","', () => {
    render(<NumberEditModal {...defaultProps} />)
    const input = screen.getByRole('textbox')

    // Simulate typing ','
    fireEvent.keyDown(input, { key: ',' })
    // The implementation of handleKeyDown for ',' uses selectionStart/End which might be tricky in JSDOM,
    // but let's see if it works. It manually sets inputValue.
    expect(input.value).toBe('5.')
  })
})
