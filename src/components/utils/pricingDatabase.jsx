const API_BASE = 'https://dishdollar-api-69cb51842c10.herokuapp.com';

const KROGER_STORES = [
  'Kroger', 'Ralphs', 'Fred Meyer', 'King Soopers', 'Smith\'s', 'Fry\'s', 
  'Harris Teeter', 'QFC', 'Food 4 Less', 'Pick N Save', 'Metro Market',
  'Mariano\'s', 'Dillons', 'Baker\'s', 'City Market'
];

// Get the store chain name from user's preferred store
function getStoreChain(storeName) {
  if (!storeName) return 'KROGER';
  const upper = storeName.toUpperCase();
  if (upper.includes('KING SOOPERS')) return 'KING SOOPERS';
  if (upper.includes('RALPHS')) return 'RALPHS';
  if (upper.includes('FRED MEYER')) return 'FRED MEYER';
  if (upper.includes('SMITH')) return 'SMITHS';
  if (upper.includes('FRY')) return 'FRYS';
  if (upper.includes('HARRIS')) return 'HARRIS TEETER';
  if (upper.includes('QFC')) return 'QFC';
  if (upper.includes('FOOD 4 LESS')) return 'FOOD 4 LESS';
  if (upper.includes('MARIANO')) return 'MARIANOS';
  if (upper.includes('DILLON')) return 'DILLONS';
  return 'KROGER';
}

// Find nearest Kroger location by ZIP
export async function findKrogerLocation(zipCode) {
  try {
    const response = await fetch(`${API_BASE}/api/kroger/locations?zip=${zipCode}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.locations?.[0] || null;
  } catch (error) {
    console.error('Error finding Kroger location:', error);
    return null;
  }
}

// Parse recipe WITH Kroger product search
export async function parseRecipeWithPrices(url, userProfile) {
  try {
    // Get user's Kroger location if they have a ZIP code
    let locationId = null;
    let storeChain = 'KROGER';
    
    if (userProfile?.location?.zip_code && hasRealTimePricing(userProfile?.preferred_store)) {
      const location = await findKrogerLocation(userProfile.location.zip_code);
      if (location) {
        locationId = location.locationId;
        storeChain = getStoreChain(userProfile.preferred_store);
      }
    }

    const response = await fetch(`${API_BASE}/api/recipe/parse-with-prices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, locationId, storeChain })
    });

    if (!response.ok) throw new Error('API request failed');
    
    const data = await response.json();
    if (!data.success) return null;
    
    return data.recipe;
  } catch (error) {
    console.error('Recipe parsing error:', error);
    return null;
  }
}

// Simple recipe parsing (no prices)
export async function parseRecipeFromUrl(url) {
  try {
    const response = await fetch(`${API_BASE}/api/recipe/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.success ? data.recipe : null;
  } catch (error) {
    console.error('Recipe parsing error:', error);
    return null;
  }
}

// Check if store supports real-time Kroger pricing
export function hasRealTimePricing(storeName) {
  if (!storeName) return false;
  return KROGER_STORES.some(s => storeName.toLowerCase().includes(s.toLowerCase()));
}

// Fallback pricing estimation
export async function getRecipePricing(ingredients, userProfile = {}) {
  try {
    const response = await fetch(`${API_BASE}/api/prices/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients })
    });
    if (!response.ok) throw new Error('Pricing failed');
    return await response.json();
  } catch (error) {
    return {
      totalCost: ingredients.length * 2.50,
      breakdown: ingredients.map(i => ({ ingredient: i.name, estimatedPrice: 2.50 })),
      confidence: 'low'
    };
  }
}

export default { parseRecipeWithPrices, parseRecipeFromUrl, hasRealTimePricing, getRecipePricing, findKrogerLocation };