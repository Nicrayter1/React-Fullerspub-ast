import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Button from '../ui/Button'

describe('Button component', () => {
  it('рендерит кнопку с текстом', () => {
    render(<Button>Нажми меня</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Нажми меня')
  })

  it('применяет классы для разных вариантов', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-primary')

    rerender(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-secondary')

    rerender(<Button variant="danger">Danger</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-error/20')

    rerender(<Button variant="outline">Outline</Button>)
    expect(screen.getByRole('button')).toHaveClass('border-primary')
  })

  it('применяет классы для разных размеров', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button')).toHaveClass('px-3')

    rerender(<Button size="md">Medium</Button>)
    expect(screen.getByRole('button')).toHaveClass('px-4')

    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button')).toHaveClass('px-6')
  })

  it('состояние disabled блокирует кнопку', () => {
    const handleClick = vi.fn()
    render(<Button disabled onClick={handleClick}>Disabled</Button>)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50')

    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('обрабатывает событие onClick', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click Me</Button>)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('рендерит иконку если передан пропс icon', () => {
    const MockIcon = ({ size }) => <svg data-testid="mock-icon" width={size} />
    render(<Button icon={MockIcon}>With Icon</Button>)

    expect(screen.getByTestId('mock-icon')).toBeInTheDocument()
  })

  it('показывает спиннер при loading=true', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByRole('button').querySelector('.animate-spin')).toBeInTheDocument()
  })
})
