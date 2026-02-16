import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import SearchInput from '../SearchInput'

describe('SearchInput component', () => {
  it('рендеринг поля ввода с правильным placeholder', () => {
    render(<SearchInput value="" onChange={() => {}} />)
    const input = screen.getByPlaceholderText('Поиск по названию или категории...')
    expect(input).toBeInTheDocument()
  })

  it('отображение переданного значения', () => {
    render(<SearchInput value="test query" onChange={() => {}} />)
    const input = screen.getByDisplayValue('test query')
    expect(input).toBeInTheDocument()
  })

  it('вызов onChange при вводе текста', () => {
    const handleChange = vi.fn()
    render(<SearchInput value="" onChange={handleChange} />)
    const input = screen.getByRole('textbox')

    fireEvent.change(input, { target: { value: 'new search' } })
    expect(handleChange).toHaveBeenCalledWith('new search')
  })

  it('очистка поля', () => {
    const handleChange = vi.fn()
    const { rerender } = render(<SearchInput value="some text" onChange={handleChange} />)
    const input = screen.getByRole('textbox')
    expect(input.value).toBe('some text')

    // Simulating clearing the input
    fireEvent.change(input, { target: { value: '' } })
    expect(handleChange).toHaveBeenCalledWith('')

    rerender(<SearchInput value="" onChange={handleChange} />)
    expect(input.value).toBe('')
  })
})
