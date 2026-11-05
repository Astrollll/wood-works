import { describe, expect, test } from 'vitest'
import {
  CATEGORIES,
  DIMENSIONS_PLAIN,
  PRODUCTS,
  getByCategory,
  getProduct,
} from './products'

describe('catalog shape', () => {
  test('has exactly 8 products', () => {
    expect(PRODUCTS).toHaveLength(8)
  })

  test('ids in Figma order', () => {
    expect(PRODUCTS.map((p) => p.id)).toEqual([
      'wooden-dining-table',
      'classic-wooden-chair',
      'wooden-cabinet',
      'study-table',
      'bed-frame',
      'coffee-table',
      'bookshelf',
      'wooden-bench',
    ])
  })

  test('prices in Figma order', () => {
    expect(PRODUCTS.map((p) => p.price)).toEqual([
      5000, 2500, 7000, 4500, 8000, 3500, 4000, 3000,
    ])
  })

  test('every product uses the shared blurb copy', () => {
    for (const p of PRODUCTS) {
      expect(p.blurb).toBe('Solid wood furniture')
    }
  })

  test('category counts match the dataset mapping', () => {
    const counts = PRODUCTS.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1
      return acc
    }, {})
    expect(counts).toEqual({ Tables: 3, Chairs: 2, Cabinets: 2, Beds: 1 })
    expect(getByCategory('Others')).toHaveLength(0)
  })
})

describe('category chips', () => {
  test('exact chip list and order', () => {
    expect(CATEGORIES).toEqual([
      'All',
      'Tables',
      'Chairs',
      'Cabinets',
      'Beds',
      'Others',
    ])
  })

  test('All returns every product', () => {
    expect(getByCategory('All')).toHaveLength(8)
  })
})

describe('wooden dining table — exact Figma copy', () => {
  const dining = getProduct('wooden-dining-table')

  test('description verbatim', () => {
    expect(dining.description).toBe(
      'A handcrafted wooden dining table designed for everyday use and durability.',
    )
  })

  test('details verbatim (multiplication sign size)', () => {
    expect(dining.details).toEqual({
      Material: 'Solid Wood',
      Size: '4 × 6 ft',
      Availability: 'Available',
    })
  })

  test('custom-order plain detail lines (letter x)', () => {
    expect(DIMENSIONS_PLAIN).toEqual([
      'Material: Solid Wood',
      'Size: 4 x 6 ft',
      'Availability: Available',
    ])
  })
})

describe('lookups', () => {
  test('unknown id -> undefined', () => {
    expect(getProduct('missing')).toBeUndefined()
  })

  test('category filter returns only that category', () => {
    const beds = getByCategory('Beds')
    expect(beds.map((p) => p.id)).toEqual(['bed-frame'])
  })
})
