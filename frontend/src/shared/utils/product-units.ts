/**
 * Centralized product unit labels by category.
 * Single source of truth — used across Product Catalog, Cart, Checkout, My Orders, etc.
 */

export const CATEGORY_UNITS: Record<string, string> = {
  Sweets: "Kg",
  Bakery: "Units",
  Snacks: "Pcs",
  Beverages: "Ltrs",
  Seasonal: "Boxes",
};

/** Returns the display unit label for a given category. */
export function getUnitLabel(category: string): string {
  return CATEGORY_UNITS[category] ?? "Units";
}

/** Maps each product name to its category — single source of truth. */
export const PRODUCT_CATEGORY_MAP: Record<string, string> = {
  // Sweets
  Kalakand: "Sweets", "Milk Cake": "Sweets", "Kaju Katli": "Sweets",
  Rasgulla: "Sweets", "Gulab Jamun": "Sweets", "Dry Fruit Laddu": "Sweets",
  "Mysore Pak": "Sweets", "Boondi Laddu": "Sweets", "Motichoor Laddu": "Sweets",
  Rasmalai: "Sweets", Badusha: "Sweets", "Dry Fruit Barfi": "Sweets",
  // Bakery
  "Milk Bread": "Bakery", "Brown Bread": "Bakery", "Cream Roll": "Bakery",
  "Chocolate Cake": "Bakery", "Fruit Cake": "Bakery", "Cup Cake": "Bakery",
  Rusk: "Bakery", "Butter Cookies": "Bakery", "Chocolate Cookies": "Bakery",
  "Plum Cake": "Bakery",
  // Snacks
  "Veg Puff": "Snacks", "Egg Puff": "Snacks", Samosa: "Snacks",
  "Veg Roll": "Snacks", "Spring Roll": "Snacks", "Khara Bun": "Snacks",
  Sandwich: "Snacks", Cutlet: "Snacks", Burger: "Snacks", "Pizza Slice": "Snacks",
  // Beverages
  "Badam Milk": "Beverages", Tea: "Beverages", Coffee: "Beverages",
  "Apple Juice": "Beverages", Lassi: "Beverages", "Mango Juice": "Beverages",
  "Orange Juice": "Beverages", "Cold Coffee": "Beverages", Milkshake: "Beverages",
  // Seasonal
  "Seasonal Gift Box": "Seasonal",
};

/** Returns the display unit for a product by name. */
export function getProductUnit(productName: string): string {
  const category = PRODUCT_CATEGORY_MAP[productName];
  return category ? getUnitLabel(category) : "Units";
}
