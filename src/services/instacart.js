/**
 * Instacart Service
 *
 * Provides integration with Instacart via our backend API.
 * All calls go through our backend which handles the Instacart IDP API.
 *
 * The backend generates links to Instacart Marketplace pages where users can:
 * - View and shop recipe ingredients
 * - Checkout their shopping list
 * - Select their preferred retailer
 */

// Get API base URL from environment
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://budgetbite-api-69cb51842c10.herokuapp.com';

/**
 * Create a shoppable recipe page on Instacart
 *
 * @param {Object} recipe - The recipe object
 * @param {string} recipe.title - Recipe title
 * @param {string} [recipe.image_url] - URL to recipe image
 * @param {number} [recipe.servings] - Number of servings (default: 4)
 * @param {number} [recipe.cooking_time] - Total cooking time in minutes
 * @param {string} [recipe.recipe_id] - Recipe ID for caching
 * @param {Array<Object>} recipe.ingredients - Array of ingredient objects
 * @param {string} recipe.ingredients[].name - Ingredient name
 * @param {number} [recipe.ingredients[].quantity] - Amount needed
 * @param {string} [recipe.ingredients[].unit] - Unit of measurement
 * @param {Array<string>} [recipe.instructions] - Cooking instructions
 *
 * @returns {Promise<Object>} Response object
 * @returns {string} returns.url - URL to the shoppable recipe page
 * @returns {boolean} returns.cached - Whether URL was from cache
 *
 * @example
 * const result = await createRecipePage({
 *   title: "Chicken Stir Fry",
 *   servings: 4,
 *   ingredients: [
 *     { name: "chicken breast", quantity: 2, unit: "lb" },
 *     { name: "broccoli", quantity: 2, unit: "cup" }
 *   ]
 * });
 * // Returns: { url: "https://www.instacart.com/store/recipes/...", cached: false }
 */
export const createRecipePage = async (recipe) => {
  const response = await fetch(`${API_BASE}/api/instacart/recipe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: recipe.title,
      image_url: recipe.image_url,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      servings: recipe.servings || 4,
      cooking_time: recipe.cooking_time,
      recipe_id: recipe.recipe_id
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `API error: ${response.status}`);
  }

  return data;
};

/**
 * Create a shopping list page on Instacart
 *
 * @param {string} title - Shopping list title
 * @param {Array<Object>} items - Array of items
 * @param {string} items[].name - Item name
 * @param {number} [items[].quantity] - Quantity needed
 * @param {string} [items[].unit] - Unit of measurement
 *
 * @returns {Promise<Object>} Response object
 * @returns {string} returns.url - URL to the shopping list page
 *
 * @example
 * const result = await createShoppingListPage('Weekly Groceries', [
 *   { name: "milk", quantity: 1, unit: "gallon" },
 *   { name: "eggs", quantity: 12, unit: "count" }
 * ]);
 * // Returns: { url: "https://www.instacart.com/store/lists/..." }
 */
export const createShoppingListPage = async (title, items) => {
  const response = await fetch(`${API_BASE}/api/instacart/shopping-list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, items })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `API error: ${response.status}`);
  }

  return data;
};

/**
 * Get nearby retailers available through Instacart
 *
 * @param {string} postalCode - User's ZIP/postal code
 *
 * @returns {Promise<Object>} Response object
 * @returns {Array<Object>} returns.retailers - Array of retailer objects
 * @returns {string} returns.retailers[].retailer_key - Unique retailer key for URL param
 * @returns {string} returns.retailers[].name - Retailer name
 * @returns {string} returns.retailers[].retailer_logo_url - URL to retailer logo
 *
 * @example
 * const { retailers } = await getNearbyRetailers('80202');
 * // Returns: { retailers: [
 * //   { retailer_key: "king_soopers", name: "King Soopers", retailer_logo_url: "..." },
 * //   { retailer_key: "safeway", name: "Safeway", retailer_logo_url: "..." }
 * // ]}
 */
export const getNearbyRetailers = async (postalCode) => {
  const response = await fetch(`${API_BASE}/api/instacart/retailers?postal_code=${encodeURIComponent(postalCode)}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `API error: ${response.status}`);
  }

  return data;
};

/**
 * Append retailer_key parameter to Instacart URL
 *
 * @param {string} instacartUrl - The Instacart URL
 * @param {string} retailerKey - The retailer key to append
 * @returns {string} URL with retailer_key parameter
 */
export const appendRetailerKey = (instacartUrl, retailerKey) => {
  if (!instacartUrl || !retailerKey) return instacartUrl;
  const separator = instacartUrl.includes('?') ? '&' : '?';
  return `${instacartUrl}${separator}retailer_key=${retailerKey}`;
};

export default {
  createRecipePage,
  createShoppingListPage,
  getNearbyRetailers,
  appendRetailerKey
};
