/**
 * Instacart Developer Platform (IDP) Service
 *
 * Provides integration with Instacart's API for:
 * - Creating shoppable recipe pages
 * - Finding nearby retailers
 * - Product search and pricing
 *
 * @see https://docs.instacart.com/developer_platform_api/
 */

const INSTACART_API_KEY = import.meta.env.VITE_INSTACART_API_KEY;
const INSTACART_BASE_URL = 'https://connect.instacart.com/idp/v1';

/**
 * Check if Instacart API is configured
 * @returns {boolean} True if API key is available
 */
export const isInstacartConfigured = () => {
  return !!INSTACART_API_KEY;
};

/**
 * Create a shoppable recipe page on Instacart
 *
 * This generates a URL where users can view the recipe and add all ingredients
 * to their Instacart cart with a single click.
 *
 * @param {Object} recipe - The recipe object
 * @param {string} recipe.title - Recipe title
 * @param {string} [recipe.image_url] - URL to recipe image
 * @param {number} [recipe.servings] - Number of servings (default: 4)
 * @param {number} [recipe.total_time] - Total cooking time in minutes
 * @param {Array<Object>} recipe.ingredients - Array of ingredient objects
 * @param {string} recipe.ingredients[].name - Generic ingredient name (e.g., "baby spinach")
 * @param {string} [recipe.ingredients[].display_text] - Full display text (e.g., "1 cup fresh baby spinach")
 * @param {Array<Object>} [recipe.ingredients[].measurements] - Quantity/unit pairs
 * @param {number} recipe.ingredients[].measurements[].quantity - Amount
 * @param {string} recipe.ingredients[].measurements[].unit - Unit of measurement
 * @param {Object} [recipe.ingredients[].filters] - Optional filters
 * @param {Array<string>} [recipe.ingredients[].filters.brand_filters] - Preferred brands
 * @param {Array<string>} [recipe.ingredients[].filters.health_filters] - Health filters (ORGANIC, GLUTEN_FREE, etc.)
 *
 * @param {Object} [options] - Additional options
 * @param {string} [options.linkback_url] - URL to link back to your recipe page
 * @param {boolean} [options.enable_pantry_items] - Allow users to exclude pantry items (default: true)
 * @param {string} [options.postal_code] - User's postal code for store selection
 *
 * @returns {Promise<Object>} Response object
 * @returns {string} returns.recipe_url - URL to the shoppable recipe page
 * @returns {string} returns.recipe_id - Unique identifier for the recipe
 * @returns {number} returns.matched_items - Number of ingredients matched to products
 * @returns {number} returns.total_items - Total number of ingredients
 *
 * @example
 * const result = await createShoppableRecipe({
 *   title: "Chicken Stir Fry",
 *   servings: 4,
 *   ingredients: [
 *     { name: "chicken breast", display_text: "2 lbs boneless chicken breast", measurements: [{ quantity: 2, unit: "lb" }] },
 *     { name: "broccoli", display_text: "2 cups broccoli florets", measurements: [{ quantity: 2, unit: "cup" }] }
 *   ]
 * }, {
 *   linkback_url: "https://dishdollar.com/recipe/123",
 *   enable_pantry_items: true
 * });
 *
 * // Returns: { recipe_url: "https://instacart.com/...", recipe_id: "abc123", matched_items: 2, total_items: 2 }
 */
export const createShoppableRecipe = async (recipe, options = {}) => {
  if (!isInstacartConfigured()) {
    console.warn('Instacart API not configured. Set VITE_INSTACART_API_KEY environment variable.');
    return {
      error: 'INSTACART_NOT_CONFIGURED',
      message: 'Instacart integration is not configured'
    };
  }

  // TODO: Implement actual API call when Instacart API key is available
  //
  // const payload = {
  //   title: recipe.title,
  //   image_url: recipe.image_url,
  //   servings: recipe.servings || 4,
  //   cooking_time: recipe.total_time,
  //   ingredients: recipe.ingredients.map(ing => ({
  //     name: ing.name,
  //     display_text: ing.display_text || `${ing.amount || ''} ${ing.unit || ''} ${ing.name}`.trim(),
  //     measurements: ing.measurements || [{ quantity: ing.amount || 1, unit: ing.unit || 'unit' }],
  //     filters: ing.filters
  //   })),
  //   landing_page_configuration: {
  //     partner_linkback_url: options.linkback_url,
  //     enable_pantry_items: options.enable_pantry_items ?? true
  //   }
  // };
  //
  // const response = await fetch(`${INSTACART_BASE_URL}/products/recipe`, {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${INSTACART_API_KEY}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify(payload)
  // });
  //
  // if (!response.ok) {
  //   throw new Error(`Instacart API error: ${response.status}`);
  // }
  //
  // return response.json();

  // Placeholder response for development
  return {
    recipe_url: null,
    recipe_id: null,
    matched_items: 0,
    total_items: recipe.ingredients?.length || 0,
    _placeholder: true,
    message: 'Instacart integration pending API key'
  };
};

/**
 * Get nearby retailers available through Instacart
 *
 * Returns a list of grocery stores near the user that support Instacart delivery.
 *
 * @param {Object} location - User location
 * @param {string} [location.postal_code] - Postal/ZIP code
 * @param {number} [location.latitude] - Latitude coordinate
 * @param {number} [location.longitude] - Longitude coordinate
 *
 * @param {Object} [options] - Additional options
 * @param {number} [options.limit] - Maximum number of retailers to return (default: 20)
 * @param {boolean} [options.pickup_only] - Only return retailers with pickup available
 * @param {boolean} [options.delivery_only] - Only return retailers with delivery available
 *
 * @returns {Promise<Object>} Response object
 * @returns {Array<Object>} returns.retailers - Array of retailer objects
 * @returns {string} returns.retailers[].id - Unique retailer ID
 * @returns {string} returns.retailers[].name - Retailer name (e.g., "Kroger", "Whole Foods")
 * @returns {string} returns.retailers[].logo_url - URL to retailer logo
 * @returns {Object} returns.retailers[].location - Store location details
 * @returns {string} returns.retailers[].location.address - Street address
 * @returns {string} returns.retailers[].location.city - City
 * @returns {string} returns.retailers[].location.state - State
 * @returns {string} returns.retailers[].location.postal_code - ZIP code
 * @returns {number} returns.retailers[].distance_miles - Distance from user
 * @returns {boolean} returns.retailers[].supports_delivery - Delivery available
 * @returns {boolean} returns.retailers[].supports_pickup - Pickup available
 * @returns {Object} returns.retailers[].delivery_eta - Estimated delivery time
 *
 * @example
 * const { retailers } = await getNearbyRetailers({ postal_code: "80202" });
 *
 * // Returns: { retailers: [
 * //   { id: "kroger-123", name: "King Soopers", distance_miles: 1.2, ... },
 * //   { id: "wholefds-456", name: "Whole Foods", distance_miles: 2.5, ... }
 * // ]}
 */
export const getNearbyRetailers = async (location, options = {}) => {
  if (!isInstacartConfigured()) {
    console.warn('Instacart API not configured. Set VITE_INSTACART_API_KEY environment variable.');
    return {
      error: 'INSTACART_NOT_CONFIGURED',
      message: 'Instacart integration is not configured',
      retailers: []
    };
  }

  // TODO: Implement actual API call when Instacart API key is available
  //
  // const params = new URLSearchParams();
  // if (location.postal_code) params.append('postal_code', location.postal_code);
  // if (location.latitude) params.append('latitude', location.latitude);
  // if (location.longitude) params.append('longitude', location.longitude);
  // if (options.limit) params.append('limit', options.limit);
  //
  // const response = await fetch(`${INSTACART_BASE_URL}/retailers?${params}`, {
  //   headers: {
  //     'Authorization': `Bearer ${INSTACART_API_KEY}`,
  //     'Content-Type': 'application/json'
  //   }
  // });
  //
  // if (!response.ok) {
  //   throw new Error(`Instacart API error: ${response.status}`);
  // }
  //
  // return response.json();

  // Placeholder response for development
  return {
    retailers: [],
    _placeholder: true,
    message: 'Instacart integration pending API key'
  };
};

/**
 * Create a shopping list on Instacart
 *
 * Creates a shareable shopping list URL for a collection of items.
 *
 * @param {Array<Object>} items - Array of items to add
 * @param {string} items[].name - Item name
 * @param {number} [items[].quantity] - Quantity needed
 * @param {string} [items[].unit] - Unit of measurement
 *
 * @param {Object} [options] - Additional options
 * @param {string} [options.list_name] - Name for the shopping list
 * @param {string} [options.retailer_id] - Preferred retailer ID
 *
 * @returns {Promise<Object>} Response object
 * @returns {string} returns.list_url - URL to the shopping list
 * @returns {string} returns.list_id - Unique identifier for the list
 */
export const createShoppingList = async (items, options = {}) => {
  if (!isInstacartConfigured()) {
    console.warn('Instacart API not configured. Set VITE_INSTACART_API_KEY environment variable.');
    return {
      error: 'INSTACART_NOT_CONFIGURED',
      message: 'Instacart integration is not configured'
    };
  }

  // TODO: Implement actual API call
  // POST /idp/v1/products/list

  return {
    list_url: null,
    list_id: null,
    _placeholder: true,
    message: 'Instacart integration pending API key'
  };
};

/**
 * Generate an affiliate link for Instacart
 *
 * Wraps any Instacart URL with affiliate tracking parameters.
 * Commission: 5% of cart value, 7-day attribution window.
 *
 * @param {string} instacartUrl - The Instacart URL to wrap
 * @param {Object} [tracking] - Tracking parameters
 * @param {string} [tracking.utm_source] - UTM source (default: "dishdollar")
 * @param {string} [tracking.utm_medium] - UTM medium (default: "recipe")
 * @param {string} [tracking.utm_campaign] - Campaign name
 * @param {string} [tracking.recipe_id] - Recipe ID for tracking
 *
 * @returns {string} Affiliate-wrapped URL
 */
export const generateAffiliateLink = (instacartUrl, tracking = {}) => {
  if (!instacartUrl) return null;

  const url = new URL(instacartUrl);

  // Add UTM parameters
  url.searchParams.set('utm_source', tracking.utm_source || 'dishdollar');
  url.searchParams.set('utm_medium', tracking.utm_medium || 'recipe');
  if (tracking.utm_campaign) {
    url.searchParams.set('utm_campaign', tracking.utm_campaign);
  }
  if (tracking.recipe_id) {
    url.searchParams.set('ref_recipe', tracking.recipe_id);
  }

  return url.toString();
};

export default {
  isInstacartConfigured,
  createShoppableRecipe,
  getNearbyRetailers,
  createShoppingList,
  generateAffiliateLink
};
