import { describe, it, expect } from 'vitest'
import { parseNumber, formatNumber } from '../format'

describe('format utils', () => {
  describe('parseNumber', () => {
    it('должен заменять запятую на точку', () => {
      expect(parseNumber('1,5')).toBe(1.5)
    })

    it('должна обрабатывать числа с точкой', () => {
      expect(parseNumber('1.5')).toBe(1.5)
    })

    it('должна возвращать 0 для невалидного ввода', () => {
      expect(parseNumber('abc')).toBe(0)
      expect(parseNumber('')).toBe(0)
    })

    it('должна обрабатывать целые числа', () => {
      expect(parseNumber('10')).toBe(10)
    })
  })

  describe('formatNumber', () => {
    it('должна форматировать число в строку', () => {
      expect(formatNumber(1.5)).toBe('1.5')
      expect(formatNumber(10)).toBe('10')
    })

    it('должна возвращать "0" для нуля', () => {
      expect(formatNumber(0)).toBe('0')
      expect(formatNumber('0')).toBe('0')
    })

    it('должна обрабатывать строковые значения', () => {
      expect(formatNumber('5.5')).toBe('5.5')
    })

    it('должна возвращать "0" для undefined или null', () => {
      expect(formatNumber(undefined)).toBe('0')
      expect(formatNumber(null)).toBe('0')
    })
  })
})
