/**
 * Mock catalog, transcribed from the Figma file's Home + Catalog screens
 * (spec §4/§6). Prices are plain numbers; formatPrice() renders them.
 */

export const PRODUCTS = [
  {
    id: 'wooden-dining-table',
    name: 'Wooden Dining Table',
    category: 'Tables',
    price: 5000,
    blurb: 'Solid wood furniture',
    description:
      'A handcrafted wooden dining table designed for everyday use and durability.',
    details: {
      Material: 'Solid Wood',
      Size: '4 × 6 ft',
      Availability: 'Available',
    },
  },
  {
    id: 'classic-wooden-chair',
    name: 'Classic Wooden Chair',
    category: 'Chairs',
    price: 2500,
    blurb: 'Solid wood furniture',
    description:
      'A sturdy classic wooden chair that fits any dining or study space.',
    details: {
      Material: 'Solid Wood',
      Size: '2 × 2 ft',
      Availability: 'Available',
    },
  },
  {
    id: 'wooden-cabinet',
    name: 'Wooden Cabinet',
    category: 'Cabinets',
    price: 7000,
    blurb: 'Solid wood furniture',
    description:
      'A spacious wooden cabinet built to keep your essentials organized.',
    details: {
      Material: 'Solid Wood',
      Size: '2 × 4 ft',
      Availability: 'Available',
    },
  },
  {
    id: 'study-table',
    name: 'Study Table',
    category: 'Tables',
    price: 4500,
    blurb: 'Solid wood furniture',
    description:
      'A compact solid wood study table designed for work and learning.',
    details: {
      Material: 'Solid Wood',
      Size: '3 × 2 ft',
      Availability: 'Available',
    },
  },
  {
    id: 'bed-frame',
    name: 'Bed Frame',
    category: 'Beds',
    price: 8000,
    blurb: 'Solid wood furniture',
    description:
      'A solid wood bed frame crafted for strength, comfort, and style.',
    details: {
      Material: 'Solid Wood',
      Size: '6 × 5 ft',
      Availability: 'Available',
    },
  },
  {
    id: 'coffee-table',
    name: 'Coffee Table',
    category: 'Tables',
    price: 3500,
    blurb: 'Solid wood furniture',
    description:
      'A low-profile wooden coffee table perfect for your living space.',
    details: {
      Material: 'Solid Wood',
      Size: '3 × 2 ft',
      Availability: 'Available',
    },
  },
  {
    id: 'bookshelf',
    name: 'Bookshelf',
    category: 'Cabinets',
    price: 4000,
    blurb: 'Solid wood furniture',
    description:
      'A solid wood bookshelf with open shelving for your growing library.',
    details: {
      Material: 'Solid Wood',
      Size: '3 × 6 ft',
      Availability: 'Available',
    },
  },
  {
    id: 'wooden-bench',
    name: 'Wooden Bench',
    category: 'Chairs',
    price: 3000,
    blurb: 'Solid wood furniture',
    description:
      'A simple solid wood bench suited for entryways, gardens, and porches.',
    details: {
      Material: 'Solid Wood',
      Size: '4 × 1.5 ft',
      Availability: 'Available',
    },
  },
]

/** Category chips on the Catalog screen, in Figma order. */
export const CATEGORIES = ['All', 'Tables', 'Chairs', 'Cabinets', 'Beds', 'Others']

/**
 * The Custom Orders screen prints its detail lines with a plain "x" (letter)
 * rather than the multiplication sign used on Product Details (spec §4a).
 */
export const DIMENSIONS_PLAIN = [
  'Material: Solid Wood',
  'Size: 4 x 6 ft',
  'Availability: Available',
]

/** @returns {typeof PRODUCTS[number] | undefined} */
export function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id)
}

/**
 * @param {'All' | 'Tables' | 'Chairs' | 'Cabinets' | 'Beds' | 'Others'} category
 */
export function getByCategory(category) {
  if (category === 'All') return PRODUCTS
  return PRODUCTS.filter((p) => p.category === category)
}
