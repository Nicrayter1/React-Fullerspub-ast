import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ProductList from '../ProductList'

const mockProducts = [
  {
    id: 1,
    name: 'Martini Bianco',
    volume: '750ml',
    category_name: 'Vermouth',
    category_id: 1,
    bar1: 2.5,
    bar2: 1,
    cold_room: 5,
    order_index: 1,
    is_frozen: false,
    visible_to_bar1: true,
    visible_to_bar2: true
  },
  {
    id: 2,
    name: 'Jack Daniels',
    volume: '700ml',
    category_name: 'Whiskey',
    category_id: 2,
    bar1: 3,
    bar2: 2,
    cold_room: 8,
    order_index: 2,
    is_frozen: false,
    visible_to_bar1: true,
    visible_to_bar2: true
  },
  {
    id: 3,
    name: 'Frozen Gin',
    volume: '1000ml',
    category_name: 'Gin',
    category_id: 3,
    bar1: 0,
    bar2: 0,
    cold_room: 0,
    order_index: 3,
    is_frozen: true,
    visible_to_bar1: true,
    visible_to_bar2: true
  }
]

const mockColumns = ['bar1', 'bar2', 'cold_room']

describe('ProductList component', () => {
  const defaultProps = {
    products: mockProducts,
    searchQuery: '',
    categoryId: null,
    availableColumns: mockColumns,
    onEdit: vi.fn(),
  }

  it('рендеринг таблицы с продуктами', () => {
    render(<ProductList {...defaultProps} />)
    expect(screen.getByText('Martini Bianco')).toBeInTheDocument()
    expect(screen.getByText('Jack Daniels')).toBeInTheDocument()
  })

  it('отображение названий категорий', () => {
    render(<ProductList {...defaultProps} />)
    expect(screen.getByText('Vermouth')).toBeInTheDocument()
    expect(screen.getByText('Whiskey')).toBeInTheDocument()
  })

  it('отображение только доступных колонок', () => {
    const { rerender } = render(<ProductList {...defaultProps} availableColumns={['bar1']} />)
    expect(screen.getByText('Бар 1 (Факт)')).toBeInTheDocument()
    expect(screen.queryByText('Бар 2 (Факт)')).not.toBeInTheDocument()

    rerender(<ProductList {...defaultProps} availableColumns={['bar2', 'cold_room']} />)
    expect(screen.queryByText('Бар 1 (Факт)')).not.toBeInTheDocument()
    expect(screen.getByText('Бар 2 (Факт)')).toBeInTheDocument()
    expect(screen.getByText('Холод. комната (Факт)')).toBeInTheDocument()
  })

  it('вызов onEdit при клике на ячейку с числом', () => {
    const onEdit = vi.fn()
    render(<ProductList {...defaultProps} onEdit={onEdit} />)

    // Find button with text '2.5' (Martini Bianco in bar1)
    const editButton = screen.getByText('2.5')
    fireEvent.click(editButton)

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Martini Bianco' }), 'bar1')
  })

  it('фильтрация по категории', () => {
    render(<ProductList {...defaultProps} categoryId={1} />)
    expect(screen.getByText('Martini Bianco')).toBeInTheDocument()
    expect(screen.queryByText('Jack Daniels')).not.toBeInTheDocument()
  })

  it('фильтрация по поисковому запросу', () => {
    const { rerender } = render(<ProductList {...defaultProps} searchQuery="Jack" />)
    expect(screen.getByText('Jack Daniels')).toBeInTheDocument()
    expect(screen.queryByText('Martini Bianco')).not.toBeInTheDocument()

    rerender(<ProductList {...defaultProps} searchQuery="Vermouth" />)
    expect(screen.getByText('Martini Bianco')).toBeInTheDocument()
    expect(screen.queryByText('Jack Daniels')).not.toBeInTheDocument()
  })

  it('не отображает замороженные продукты', () => {
    render(<ProductList {...defaultProps} />)
    expect(screen.queryByText('Frozen Gin')).not.toBeInTheDocument()
  })

  it('пустое состояние', () => {
    render(<ProductList {...defaultProps} products={[]} />)
    expect(screen.getByText('Продукты не найдены')).toBeInTheDocument()
  })

  it('правильная сортировка по order_index', () => {
    const unorderedProducts = [
      { id: 1, name: 'Prod 1', order_index: 10, category_name: 'Cat', is_frozen: false, visible_to_bar1: true, visible_to_bar2: true },
      { id: 2, name: 'Prod 2', order_index: 5, category_name: 'Cat', is_frozen: false, visible_to_bar1: true, visible_to_bar2: true }
    ]
    render(<ProductList {...defaultProps} products={unorderedProducts} />)

    const cells = screen.getAllByRole('cell')
    // First cell in body after category header should be 'Prod 2' because it has lower order_index
    // Actually the first cell is 'Prod 2' name.
    // Let's check the text content of the first few cells in tbody.
    // Category row takes one row.

    const rows = screen.getAllByRole('row')
    // row 0: headers
    // row 1: category 'Cat'
    // row 2: Prod 2 (order_index 5)
    // row 3: Prod 1 (order_index 10)
    expect(rows[2]).toHaveTextContent('Prod 2')
    expect(rows[3]).toHaveTextContent('Prod 1')
  })
})
