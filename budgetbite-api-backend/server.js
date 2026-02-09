require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cheerio = require('cheerio');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration - allow specific origins
const allowedOrigins = [
  'https://dishdollar.com',
  'https://www.dishdollar.com',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Also allow any vercel preview URLs
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true
}));

app.use(express.json());

// Dry run mode for testing (set DRY_RUN=true to log requests instead of calling APIs)
const DRY_RUN = process.env.DRY_RUN === 'true';

// Kroger API credentials from environment
const KROGER_CLIENT_ID = process.env.KROGER_CLIENT_ID;
const KROGER_CLIENT_SECRET = process.env.KROGER_CLIENT_SECRET;
const KROGER_API_BASE = 'https://api.kroger.com/v1';

// Instacart API configuration
const INSTACART_API_KEY = process.env.INSTACART_API_KEY;
const INSTACART_API_URL = process.env.INSTACART_API_URL || 'https://connect.dev.instacart.tools';
const INSTACART_API_BASE = `${INSTACART_API_URL}/idp/v1`;
const PARTNER_LINKBACK_URL = 'https://dishdollar.com';

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

// Token cache
let accessToken = null;
let tokenExpiry = null;

// Kroger store chain URL mappings
const KROGER_STORE_URLS = {
  'KROGER': 'https://www.kroger.com',
  'RALPHS': 'https://www.ralphs.com',
  'KING SOOPERS': 'https://www.kingsoopers.com',
  'KINGSOOPERS': 'https://www.kingsoopers.com',
  'FRY\'S': 'https://www.frysfood.com',
  'FRYS': 'https://www.frysfood.com',
  'SMITH\'S': 'https://www.smithsfoodanddrug.com',
  'SMITHS': 'https://www.smithsfoodanddrug.com',
  'FRED MEYER': 'https://www.fredmeyer.com',
  'FREDMEYER': 'https://www.fredmeyer.com',
  'QFC': 'https://www.qfc.com',
  'HARRIS TEETER': 'https://www.harristeeter.com',
  'HARRISTEETER': 'https://www.harristeeter.com',
  'FOOD 4 LESS': 'https://www.food4less.com',
  'FOOD4LESS': 'https://www.food4less.com',
  'PICK N SAVE': 'https://www.picknsave.com',
  'PICKNSAVE': 'https://www.picknsave.com',
  'METRO MARKET': 'https://www.metromarket.net',
  'METROMARKET': 'https://www.metromarket.net',
  'MARIANOS': 'https://www.marianos.com',
  'DILLONS': 'https://www.dillons.com',
  'BAKERS': 'https://www.bakersplus.com',
  'CITY MARKET': 'https://www.citymarket.com'
};

// ============================================
// KROGER API FUNCTIONS
// ============================================

async function getKrogerToken() {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const credentials = Buffer.from(`${KROGER_CLIENT_ID}:${KROGER_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch('https://api.kroger.com/v1/connect/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    },
    body: 'grant_type=client_credentials&scope=product.compact'
  });

  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
  
  return accessToken;
}

/**
 * Search for a product at Kroger and return best match
 */
async function searchKrogerProduct(searchTerm, locationId, storeChain = 'KROGER') {
  try {
    const token = await getKrogerToken();
    
    // Clean up search term for better results
    const cleanTerm = searchTerm
      .toLowerCase()
      .replace(/\(.*?\)/g, '')  // Remove parentheses
      .replace(/,.*$/, '')       // Remove everything after comma
      .replace(/fresh|organic|frozen|canned|chopped|diced|minced|sliced|shredded/gi, '')
      .replace(/boneless|skinless/gi, '')
      .replace(/for serving/gi, '')
      .trim()
      .split(' ')
      .slice(0, 3)  // Max 3 words for search
      .join(' ');
    
    if (!cleanTerm || cleanTerm.length < 2) {
      return null;
    }

    const params = new URLSearchParams({
      'filter.term': cleanTerm,
      'filter.locationId': locationId,
      'filter.limit': '5',
      'filter.fulfillment': 'ais'
    });

    const response = await fetch(
      `${KROGER_API_BASE}/products?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`Kroger product search failed for "${cleanTerm}": ${response.status}`);
      return null;
    }

    const data = await response.json();
    const products = data.data || [];
    
    if (products.length === 0) {
      return null;
    }

    // Get the best match (first result is usually most relevant)
    const product = products[0];
    const price = product.items?.[0]?.price?.regular || product.items?.[0]?.price?.promo;
    const promoPrice = product.items?.[0]?.price?.promo;
    const upc = product.upc;
    
    // Build the product URL for the specific store chain
    const baseUrl = KROGER_STORE_URLS[storeChain.toUpperCase()] || 'https://www.kroger.com';
    const productUrl = `${baseUrl}/p/${encodeURIComponent(product.description?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'product')}/${upc}`;

    return {
      productId: product.productId,
      upc: upc,
      name: product.description,
      brand: product.brand,
      size: product.items?.[0]?.size || '',
      price: price,
      promoPrice: promoPrice,
      isOnSale: promoPrice && promoPrice < price,
      productUrl: productUrl,
      image: product.images?.find(img => img.perspective === 'front')?.sizes?.find(s => s.size === 'medium')?.url
    };
  } catch (error) {
    console.error(`Error searching Kroger for "${searchTerm}":`, error.message);
    return null;
  }
}

// ============================================
// API ENDPOINTS
// ============================================

// GET /api/kroger/locations - Find stores by ZIP
app.get('/api/kroger/locations', async (req, res) => {
  try {
    const { zip, radius = 10 } = req.query;
    
    if (!zip) {
      return res.status(400).json({ error: 'ZIP code required' });
    }

    const token = await getKrogerToken();
    
    const response = await fetch(
      `${KROGER_API_BASE}/locations?filter.zipCode.near=${zip}&filter.radiusInMiles=${radius}&filter.limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Kroger API error: ${response.status}`);
    }

    const data = await response.json();
    
    const locations = (data.data || []).map(loc => ({
      locationId: loc.locationId,
      name: loc.name,
      chain: loc.chain,
      address: {
        street: loc.address?.addressLine1,
        city: loc.address?.city,
        state: loc.address?.state,
        zip: loc.address?.zipCode
      }
    }));

    res.json({ locations });
  } catch (error) {
    console.error('Location search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/kroger/products - Search products
app.get('/api/kroger/products', async (req, res) => {
  try {
    const { term, locationId } = req.query;

    if (!term || !locationId) {
      return res.status(400).json({ error: 'term and locationId required' });
    }

    const product = await searchKrogerProduct(term, locationId);
    res.json({ product });
  } catch (error) {
    console.error('Product search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// INSTACART API ENDPOINTS
// ============================================

/**
 * Generate a hash from ingredients for cache key
 * Sorts ingredients by name and creates a deterministic hash
 */
function generateIngredientsHash(ingredients) {
  const normalized = ingredients
    .map(ing => ({
      name: (ing.name || '').toLowerCase().trim(),
      quantity: parseFloat(ing.quantity || ing.amount || 1)
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const hashInput = JSON.stringify(normalized);
  return crypto.createHash('sha256').update(hashInput).digest('hex').substring(0, 32);
}

/**
 * Check cache for existing Instacart URL
 */
async function getCachedInstacartUrl(recipeId, ingredientsHash, servings) {
  if (!supabase || !recipeId) return null;

  try {
    const { data, error } = await supabase
      .from('instacart_recipe_links')
      .select('instacart_url')
      .eq('recipe_id', recipeId)
      .eq('ingredients_hash', ingredientsHash)
      .eq('servings', servings)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return null;
    return data.instacart_url;
  } catch (err) {
    console.error('Cache lookup error:', err);
    return null;
  }
}

/**
 * Store Instacart URL in cache
 */
async function cacheInstacartUrl(recipeId, ingredientsHash, servings, instacartUrl) {
  if (!supabase || !recipeId) return;

  try {
    // Set expiration to 13 days from now (Instacart links expire after 14 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 13);

    const { error } = await supabase
      .from('instacart_recipe_links')
      .upsert({
        recipe_id: recipeId,
        ingredients_hash: ingredientsHash,
        servings: servings,
        instacart_url: instacartUrl,
        expires_at: expiresAt.toISOString()
      }, {
        onConflict: 'recipe_id,ingredients_hash,servings'
      });

    if (error) {
      console.error('Cache store error:', error);
    } else {
      console.log(`Cached Instacart URL for recipe ${recipeId}`);
    }
  } catch (err) {
    console.error('Cache store error:', err);
  }
}

/**
 * Clean ingredient name for Instacart product search
 * Removes quantities, measurements, and preparation instructions
 * Uses word boundaries (\b) to avoid matching partial words
 */
function cleanIngredientName(name) {
  if (!name || typeof name !== 'string') {
    return name || '';
  }

  return name
    .replace(/^[\d\s\/.,-]+/, '')                    // Remove leading numbers/fractions
    .replace(/\(.*?\)/g, '')                         // Remove parentheses content
    .replace(/,.*$/, '')                             // Remove everything after comma
    .replace(/\b(for serving|to serve|optional|garnish|to taste|as needed)\b/gi, '')
    .replace(/\b(fresh|frozen|canned|chopped|diced|minced|sliced|shredded|crushed|ground)\b/gi, '')
    .replace(/\b(boneless|skinless|peeled|deveined)\b/gi, '')
    .replace(/\b(cups?|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lbs?|lb|grams?|ml|liters?|cloves?|cans?|packages?|pieces?|slices?|heads?|bunches?|stalks?|sprigs?|large|medium|small|whole|pinch(?:es)?|dash(?:es)?)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Map ingredients to Instacart format
 * Input: [{ name, quantity, unit }]
 * Output: [{ name, measurements: [{ quantity, unit }] }]
 */
function mapIngredientsToInstacart(ingredients) {
  return ingredients.map(ing => {
    const cleanedName = cleanIngredientName(ing.name) || ing.name;
    const quantity = parseFloat(ing.quantity || ing.amount || 1) || 1;
    const unit = ing.unit || 'each';

    return {
      name: cleanedName,
      measurements: [{ quantity, unit }]
    };
  });
}

/**
 * Map items to Instacart shopping list format
 * Input: [{ name, quantity, unit }]
 * Output: [{ name, quantity, unit }]
 */
function mapItemsToInstacartList(items) {
  return items.map(item => {
    const cleanedName = cleanIngredientName(item.name) || item.name;
    return {
      name: cleanedName,
      quantity: parseFloat(item.quantity || 1) || 1,
      unit: item.unit || 'each'
    };
  });
}

// ============================================
// POST /api/instacart/recipe
// Creates a shoppable recipe page on Instacart
// ============================================
app.post('/api/instacart/recipe', async (req, res) => {
  try {
    const { title, image_url, ingredients, instructions, servings, cooking_time, recipe_id } = req.body;

    // Validate required fields
    if (!title || !ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({
        error: 'title and ingredients array are required'
      });
    }

    if (!INSTACART_API_KEY) {
      return res.status(500).json({
        error: 'Instacart API key not configured'
      });
    }

    const servingsCount = servings || 4;

    // Check cache for existing URL (if recipe_id provided)
    if (recipe_id) {
      const ingredientsHash = generateIngredientsHash(ingredients);
      const cachedUrl = await getCachedInstacartUrl(recipe_id, ingredientsHash, servingsCount);
      if (cachedUrl) {
        console.log(`[Instacart] Cache hit for recipe ${recipe_id}`);
        return res.json({ url: cachedUrl, cached: true });
      }
    }

    // Map ingredients to Instacart format
    const instacartIngredients = mapIngredientsToInstacart(ingredients);

    // Build request body for Instacart API
    const requestBody = {
      title: title,
      image_url: image_url || undefined,
      servings: servingsCount,
      ingredients: instacartIngredients,
      landing_page_configuration: {
        partner_linkback_url: PARTNER_LINKBACK_URL
      }
    };

    // Add optional fields
    if (cooking_time) {
      requestBody.cooking_time = cooking_time;
    }
    if (instructions && Array.isArray(instructions) && instructions.length > 0) {
      requestBody.instructions = instructions;
    }

    // Log the request that would be made
    console.log('[Instacart] POST /idp/v1/products/recipe');
    console.log('[Instacart] Request body:', JSON.stringify(requestBody, null, 2));

    // DRY_RUN mode - just log, don't call API
    if (DRY_RUN) {
      console.log('[Instacart] DRY_RUN mode - skipping actual API call');
      return res.json({
        url: 'https://www.instacart.com/store/recipes/dry-run-test',
        dry_run: true,
        request_body: requestBody
      });
    }

    // Call Instacart API
    const response = await fetch(`${INSTACART_API_BASE}/products/recipe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INSTACART_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('[Instacart] Failed to parse response:', responseText);
      return res.status(500).json({
        error: 'Invalid response from Instacart API'
      });
    }

    if (!response.ok) {
      console.error('[Instacart] API error:', response.status, responseData);
      return res.status(response.status).json({
        error: responseData.error || responseData.message || `Instacart API error: ${response.status}`,
        details: responseData
      });
    }

    console.log('[Instacart] Recipe page created:', responseData.products_link_url);

    // Cache the URL if we have a recipe_id
    if (recipe_id && responseData.products_link_url) {
      const ingredientsHash = generateIngredientsHash(ingredients);
      await cacheInstacartUrl(recipe_id, ingredientsHash, servingsCount, responseData.products_link_url);
    }

    // Return simplified response
    res.json({
      url: responseData.products_link_url,
      cached: false
    });

  } catch (error) {
    console.error('[Instacart] Recipe creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// POST /api/instacart/shopping-list
// Creates a shopping list page on Instacart
// ============================================
app.post('/api/instacart/shopping-list', async (req, res) => {
  try {
    const { title, items } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'items array is required and must not be empty'
      });
    }

    if (!INSTACART_API_KEY) {
      return res.status(500).json({
        error: 'Instacart API key not configured'
      });
    }

    // Map items to Instacart format
    const lineItems = mapItemsToInstacartList(items);

    // Build request body for Instacart API
    const requestBody = {
      title: title || 'Shopping List',
      link_type: 'shopping_list',
      line_items: lineItems,
      landing_page_configuration: {
        partner_linkback_url: PARTNER_LINKBACK_URL
      }
    };

    // Log the request
    console.log('[Instacart] POST /idp/v1/products/products_link');
    console.log('[Instacart] Request body:', JSON.stringify(requestBody, null, 2));

    // DRY_RUN mode
    if (DRY_RUN) {
      console.log('[Instacart] DRY_RUN mode - skipping actual API call');
      return res.json({
        url: 'https://www.instacart.com/store/lists/dry-run-test',
        dry_run: true,
        request_body: requestBody
      });
    }

    // Call Instacart API
    const response = await fetch(`${INSTACART_API_BASE}/products/products_link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INSTACART_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('[Instacart] Failed to parse response:', responseText);
      return res.status(500).json({
        error: 'Invalid response from Instacart API'
      });
    }

    if (!response.ok) {
      console.error('[Instacart] API error:', response.status, responseData);
      return res.status(response.status).json({
        error: responseData.error || responseData.message || `Instacart API error: ${response.status}`,
        details: responseData
      });
    }

    console.log('[Instacart] Shopping list created:', responseData.products_link_url);

    res.json({
      url: responseData.products_link_url
    });

  } catch (error) {
    console.error('[Instacart] Shopping list creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GET /api/instacart/retailers
// Gets nearby retailers available through Instacart
// ============================================
app.get('/api/instacart/retailers', async (req, res) => {
  try {
    const { postal_code } = req.query;

    if (!postal_code) {
      return res.status(400).json({
        error: 'postal_code query parameter is required'
      });
    }

    if (!INSTACART_API_KEY) {
      return res.status(500).json({
        error: 'Instacart API key not configured'
      });
    }

    const url = `${INSTACART_API_BASE}/retailers?postal_code=${encodeURIComponent(postal_code)}&country_code=US`;

    // Log the request
    console.log('[Instacart] GET /idp/v1/retailers');
    console.log('[Instacart] URL:', url);

    // DRY_RUN mode
    if (DRY_RUN) {
      console.log('[Instacart] DRY_RUN mode - returning mock retailers');
      return res.json({
        retailers: [
          { retailer_key: 'king_soopers', name: 'King Soopers', retailer_logo_url: 'https://example.com/logo.png' },
          { retailer_key: 'safeway', name: 'Safeway', retailer_logo_url: 'https://example.com/logo.png' },
          { retailer_key: 'whole_foods', name: 'Whole Foods', retailer_logo_url: 'https://example.com/logo.png' }
        ],
        dry_run: true
      });
    }

    // Call Instacart API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${INSTACART_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('[Instacart] Failed to parse response:', responseText);
      return res.status(500).json({
        error: 'Invalid response from Instacart API'
      });
    }

    if (!response.ok) {
      console.error('[Instacart] API error:', response.status, responseData);
      return res.status(response.status).json({
        error: responseData.error || responseData.message || `Instacart API error: ${response.status}`,
        details: responseData
      });
    }

    // Map response to our format
    const retailers = (responseData.retailers || []).map(r => ({
      retailer_key: r.retailer_key || r.id,
      name: r.name,
      retailer_logo_url: r.retailer_logo_url || r.logo_url
    }));

    console.log(`[Instacart] Found ${retailers.length} retailers for postal code ${postal_code}`);

    res.json({ retailers });

  } catch (error) {
    console.error('[Instacart] Retailers lookup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// RECIPE PARSING WITH KROGER PRICES
// ============================================

/**
 * Parse ingredient string - PRESERVE ORIGINAL FORMAT
 */
function parseIngredientString(ingredientStr) {
  if (!ingredientStr || typeof ingredientStr !== 'string') {
    return { 
      original: ingredientStr || 'Unknown',
      name: ingredientStr || 'Unknown', 
      amount: 1, 
      unit: '',
      forServing: false
    };
  }

  const original = ingredientStr.trim();
  
  // Check if this is a "for serving" item
  const forServing = /for serving|to serve|optional|garnish/i.test(original);
  
  // Common measurement units
  const unitPatterns = [
    'cups?', 'tablespoons?', 'tbsp', 'teaspoons?', 'tsp', 
    'ounces?', 'oz', 'pounds?', 'lbs?', 'lb',
    'grams?', 'g', 'kg', 'ml', 'liters?', 'l',
    'cloves?', 'cans?', 'packages?', 'pieces?', 'slices?',
    'heads?', 'bunches?', 'stalks?', 'sprigs?',
    'large', 'medium', 'small', 'whole', 'pinch(?:es)?', 'dash(?:es)?'
  ];
  
  const unitPattern = unitPatterns.join('|');
  
  // Try to match: amount + unit + name
  // Handles: "2 cups flour", "1/2 cup sugar", "3-4 cloves garlic", "1 (14 oz) can tomatoes"
  const regex = new RegExp(
    `^([\\d\\s\\/\\-\\.]+)?\\s*(?:\\([^)]+\\)\\s*)?\\s*(${unitPattern})?\\s*(?:\\([^)]+\\)\\s*)?\\s*(.+)$`,
    'i'
  );
  
  const match = original.match(regex);
  
  if (!match) {
    return { original, name: original, amount: 1, unit: '', forServing };
  }
  
  let amountStr = match[1]?.trim() || '';
  let unit = match[2] || '';
  let name = match[3]?.trim() || original;
  
  // Extract amount from parentheses if present (e.g., "1 (14 oz) can")
  const parenMatch = original.match(/\((\d+)\s*(oz|ounce|g|ml)\)/i);
  
  // Parse amount
  let amount = 1;
  if (amountStr) {
    try {
      if (amountStr.includes('-')) {
        const [low, high] = amountStr.split('-').map(s => parseFloat(s.trim()));
        amount = (low + high) / 2;
      } else if (amountStr.includes(' ') && amountStr.includes('/')) {
        const parts = amountStr.split(' ');
        amount = parseFloat(parts[0]) || 0;
        if (parts[1]?.includes('/')) {
          const [num, den] = parts[1].split('/');
          amount += parseFloat(num) / parseFloat(den);
        }
      } else if (amountStr.includes('/')) {
        const [num, den] = amountStr.split('/');
        amount = parseFloat(num) / parseFloat(den);
      } else {
        amount = parseFloat(amountStr) || 1;
      }
    } catch {
      amount = 1;
    }
  }
  
  // Clean up the name but keep it readable
  name = name
    .replace(/,\s*(divided|separated|plus more).*$/i, '')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .trim();
  
  return {
    original,
    name,
    amount: Math.round(amount * 100) / 100,
    unit,
    forServing
  };
}

/**
 * Parse recipe instructions
 */
function parseInstructions(instructionData) {
  if (!instructionData) return [];
  
  if (typeof instructionData === 'string') {
    return instructionData.split(/\n|(?:\d+\.\s)/).map(s => s.trim()).filter(Boolean);
  }
  
  return instructionData.map(item => {
    if (typeof item === 'string') return item;
    if (item['@type'] === 'HowToStep') return item.text || item.name;
    if (item['@type'] === 'HowToSection') {
      return item.itemListElement?.map(step => step.text || step.name).filter(Boolean) || [];
    }
    return item.text || item.name || '';
  }).flat().filter(Boolean);
}

/**
 * Extract image URL
 */
function extractImage(imageData) {
  if (!imageData) return null;
  if (typeof imageData === 'string') return imageData;
  if (Array.isArray(imageData)) {
    const img = imageData[0];
    return typeof img === 'string' ? img : img?.url || img?.contentUrl;
  }
  return imageData.url || imageData.contentUrl || null;
}

/**
 * Parse ISO 8601 duration
 */
function parseISO8601Duration(duration) {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return parseInt(match[1] || 0) * 60 + parseInt(match[2] || 0);
}

/**
 * Parse servings
 */
function parseServings(recipeYield) {
  if (!recipeYield) return 4;
  if (typeof recipeYield === 'number') return recipeYield;
  const match = String(recipeYield).match(/\d+/);
  return match ? parseInt(match[0]) : 4;
}

// POST /api/recipe/parse - Basic recipe parsing (no prices)
app.post('/api/recipe/parse', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL required' });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Find Schema.org JSON-LD recipe data
    let recipe = null;
    
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const data = JSON.parse($(el).html());
        
        if (data['@graph']) {
          const found = data['@graph'].find(item => item['@type'] === 'Recipe');
          if (found) recipe = found;
        } else if (Array.isArray(data)) {
          const found = data.find(item => item['@type'] === 'Recipe');
          if (found) recipe = found;
        } else if (data['@type'] === 'Recipe') {
          recipe = data;
        }
      } catch (e) {
        // Continue
      }
    });

    if (!recipe) {
      return res.json({ success: false, message: 'No recipe data found' });
    }

    // Parse ingredients with original format preserved
    const rawIngredients = recipe.recipeIngredient || [];
    const ingredients = rawIngredients.map(ing => parseIngredientString(ing));

    const parsedRecipe = {
      title: recipe.name || 'Untitled Recipe',
      description: recipe.description || '',
      image_url: extractImage(recipe.image),
      prep_time: parseISO8601Duration(recipe.prepTime),
      cook_time: parseISO8601Duration(recipe.cookTime),
      total_time: parseISO8601Duration(recipe.totalTime),
      servings: parseServings(recipe.recipeYield),
      ingredients,
      instructions: parseInstructions(recipe.recipeInstructions),
      cuisines: recipe.recipeCuisine ? [].concat(recipe.recipeCuisine) : [],
      source_url: url,
      source_name: new URL(url).hostname.replace('www.', ''),
      author: recipe.author?.name || recipe.author || null
    };

    res.json({ success: true, recipe: parsedRecipe });
  } catch (error) {
    console.error('Recipe parsing error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/recipe/parse-with-prices - Parse recipe AND get Kroger prices
app.post('/api/recipe/parse-with-prices', async (req, res) => {
  try {
    const { url, locationId, storeChain = 'KROGER' } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL required' });
    }

    // Fetch and parse the recipe
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Find recipe data
    let recipe = null;
    
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const data = JSON.parse($(el).html());
        
        if (data['@graph']) {
          const found = data['@graph'].find(item => item['@type'] === 'Recipe');
          if (found) recipe = found;
        } else if (Array.isArray(data)) {
          const found = data.find(item => item['@type'] === 'Recipe');
          if (found) recipe = found;
        } else if (data['@type'] === 'Recipe') {
          recipe = data;
        }
      } catch (e) {
        // Continue
      }
    });

    if (!recipe) {
      return res.json({ success: false, message: 'No recipe data found' });
    }

    // Parse ingredients
    const rawIngredients = recipe.recipeIngredient || [];
    const parsedIngredients = rawIngredients.map(ing => parseIngredientString(ing));

    // If locationId provided, search Kroger for each ingredient
    let ingredientsWithPrices = parsedIngredients;
    let totalCost = 0;
    let krogerItemsFound = 0;

    if (locationId) {
      console.log(`Searching Kroger location ${locationId} for ${parsedIngredients.length} ingredients...`);
      
      ingredientsWithPrices = [];
      
      for (const ing of parsedIngredients) {
        // Search Kroger for this ingredient
        const krogerProduct = await searchKrogerProduct(ing.name, locationId, storeChain);
        
        let estimatedPrice = 2.50; // Default fallback
        
        if (krogerProduct) {
          krogerItemsFound++;
          estimatedPrice = krogerProduct.price || 2.50;
          
          ingredientsWithPrices.push({
            ...ing,
            estimated_price: estimatedPrice,
            krogerProduct: {
              name: krogerProduct.name,
              brand: krogerProduct.brand,
              size: krogerProduct.size,
              price: krogerProduct.price,
              promoPrice: krogerProduct.promoPrice,
              isOnSale: krogerProduct.isOnSale,
              url: krogerProduct.productUrl,
              image: krogerProduct.image
            }
          });
        } else {
          // No Kroger product found - use fallback price
          ingredientsWithPrices.push({
            ...ing,
            estimated_price: estimatedPrice,
            krogerProduct: null
          });
        }
        
        totalCost += estimatedPrice;
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    } else {
      // No location - just return parsed ingredients without prices
      ingredientsWithPrices = parsedIngredients.map(ing => ({
        ...ing,
        estimated_price: 2.50,
        krogerProduct: null
      }));
      totalCost = parsedIngredients.length * 2.50;
    }

    // Separate "for serving" items
    const mainIngredients = ingredientsWithPrices.filter(ing => !ing.forServing);
    const servingIngredients = ingredientsWithPrices.filter(ing => ing.forServing);

    const parsedRecipe = {
      title: recipe.name || 'Untitled Recipe',
      description: recipe.description || '',
      image_url: extractImage(recipe.image),
      prep_time: parseISO8601Duration(recipe.prepTime),
      cook_time: parseISO8601Duration(recipe.cookTime),
      total_time: parseISO8601Duration(recipe.totalTime),
      servings: parseServings(recipe.recipeYield),
      ingredients: mainIngredients,
      servingIngredients: servingIngredients,
      instructions: parseInstructions(recipe.recipeInstructions),
      cuisines: recipe.recipeCuisine ? [].concat(recipe.recipeCuisine) : [],
      source_url: url,
      source_name: new URL(url).hostname.replace('www.', ''),
      author: recipe.author?.name || recipe.author || null,
      total_cost: Math.round(totalCost * 100) / 100,
      pricing: {
        source: locationId ? 'kroger' : 'estimate',
        krogerItemsFound,
        totalIngredients: parsedIngredients.length,
        confidence: krogerItemsFound > parsedIngredients.length * 0.5 ? 'high' : 'medium',
        storeChain
      }
    };

    res.json({ success: true, recipe: parsedRecipe });
  } catch (error) {
    console.error('Recipe parsing error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// PRICE ESTIMATION (Fallback without Kroger)
// ============================================

const GROCERY_PRICES = {
  "chicken": 3.99, "beef": 5.99, "pork": 3.99, "salmon": 9.99, "shrimp": 8.99,
  "egg": 0.30, "milk": 3.99, "butter": 4.99, "cheese": 4.99, "cream": 3.99,
  "onion": 0.75, "garlic": 0.50, "tomato": 0.50, "potato": 0.40, "carrot": 0.25,
  "pepper": 1.29, "broccoli": 1.99, "spinach": 2.99, "lettuce": 1.99,
  "rice": 2.49, "pasta": 1.49, "flour": 2.99, "bread": 2.99, "tortilla": 2.99,
  "oil": 0.50, "vinegar": 0.25, "soy sauce": 0.25, "honey": 0.50,
  "salt": 0.05, "pepper": 0.05, "cumin": 0.10, "paprika": 0.10,
  "broth": 2.49, "beans": 1.19, "tomato sauce": 0.99, "coconut milk": 2.49
};

app.post('/api/prices/estimate', (req, res) => {
  try {
    const { ingredients } = req.body;
    
    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ error: 'ingredients array required' });
    }

    const breakdown = ingredients.map(ing => {
      const name = (ing.name || '').toLowerCase();
      let price = 2.50;
      
      for (const [key, val] of Object.entries(GROCERY_PRICES)) {
        if (name.includes(key)) {
          price = val;
          break;
        }
      }
      
      return {
        ingredient: ing.name,
        amount: ing.amount || 1,
        unit: ing.unit || '',
        estimatedPrice: price,
        source: 'estimate'
      };
    });

    const totalCost = breakdown.reduce((sum, item) => sum + item.estimatedPrice, 0);

    res.json({
      totalCost: Math.round(totalCost * 100) / 100,
      breakdown,
      confidence: 'low'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PRICE SEARCH (Multiple Ingredients)
// ============================================

// POST /api/prices/search - Search Kroger prices for multiple ingredients
app.post('/api/prices/search', async (req, res) => {
  try {
    const { ingredients, zipCode, storeChain = 'KROGER' } = req.body;

    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ error: 'ingredients array required' });
    }

    // Find nearest Kroger location if zipCode provided
    let locationId = null;
    if (zipCode) {
      const token = await getKrogerToken();
      const locResponse = await fetch(
        `${KROGER_API_BASE}/locations?filter.zipCode.near=${zipCode}&filter.radiusInMiles=10&filter.limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );

      if (locResponse.ok) {
        const locData = await locResponse.json();
        locationId = locData.data?.[0]?.locationId;
      }
    }

    if (!locationId) {
      // No location found - return estimated prices
      const items = ingredients.map(ing => ({
        ingredient: ing.name,
        price: GROCERY_PRICES[ing.name?.toLowerCase()] || 2.50,
        source: 'estimated'
      }));

      return res.json({
        success: true,
        items,
        totalCost: items.reduce((sum, i) => sum + i.price, 0),
        source: 'estimated'
      });
    }

    // Search Kroger for each ingredient
    const items = [];
    let totalCost = 0;

    for (const ing of ingredients) {
      const product = await searchKrogerProduct(ing.name, locationId, storeChain);

      const price = product?.price || GROCERY_PRICES[ing.name?.toLowerCase()] || 2.50;
      totalCost += price;

      items.push({
        ingredient: ing.name,
        price,
        productName: product?.name || null,
        brand: product?.brand || null,
        size: product?.size || null,
        productUrl: product?.productUrl || null,
        image: product?.image || null,
        source: product ? 'kroger' : 'estimated'
      });

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    res.json({
      success: true,
      items,
      totalCost: Math.round(totalCost * 100) / 100,
      source: 'kroger',
      locationId
    });
  } catch (error) {
    console.error('Price search error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// RECIPE DISCOVERY
// ============================================

// Curated recipe URLs by category
const DISCOVERY_RECIPES = {
  budget: [
    'https://www.budgetbytes.com/one-pot-creamy-cajun-chicken-pasta/',
    'https://www.budgetbytes.com/slow-cooker-chicken-tikka-masala/',
    'https://www.budgetbytes.com/black-bean-quesadillas/',
    'https://www.budgetbytes.com/greek-turkey-and-rice-skillet/',
    'https://www.budgetbytes.com/easy-pad-thai/'
  ],
  healthy: [
    'https://www.skinnytaste.com/air-fryer-salmon/',
    'https://www.skinnytaste.com/greek-chicken-sheet-pan-dinner/',
    'https://www.skinnytaste.com/cauliflower-fried-rice/'
  ],
  comfort: [
    'https://natashaskitchen.com/perfect-beef-stroganoff-recipe/',
    'https://natashaskitchen.com/chicken-alfredo-pasta/',
    'https://natashaskitchen.com/easy-chicken-stir-fry/'
  ],
  vegan: [
    'https://minimalistbaker.com/easy-vegan-fried-rice/',
    'https://minimalistbaker.com/1-pot-golden-curry-lentil-soup/',
    'https://minimalistbaker.com/crispy-baked-falafel/'
  ],
  quick: [
    'https://www.simplyrecipes.com/recipes/easy_garlic_butter_shrimp/',
    'https://www.simplyrecipes.com/recipes/chicken_caesar_salad/',
    'https://www.simplyrecipes.com/recipes/caprese_salad/'
  ]
};

// POST /api/recipes/discover - Discover new recipes based on preferences
app.post('/api/recipes/discover', async (req, res) => {
  try {
    const { cuisines = [], diets = [], category = 'budget', limit = 6 } = req.body;

    // Select URLs based on category and diets
    let selectedCategory = category;
    if (diets.includes('Vegan') || diets.includes('Vegetarian')) {
      selectedCategory = 'vegan';
    } else if (diets.includes('Keto') || diets.includes('Paleo') || diets.includes('Whole30')) {
      selectedCategory = 'healthy';
    }

    const categoryUrls = DISCOVERY_RECIPES[selectedCategory] || DISCOVERY_RECIPES.budget;

    // Mix in some variety from other categories
    const allUrls = [...categoryUrls];
    Object.keys(DISCOVERY_RECIPES).forEach(cat => {
      if (cat !== selectedCategory) {
        allUrls.push(...DISCOVERY_RECIPES[cat].slice(0, 1));
      }
    });

    // Shuffle and limit
    const shuffled = allUrls.sort(() => Math.random() - 0.5).slice(0, limit);

    // Parse each recipe
    const recipes = [];

    for (const url of shuffled) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        if (!response.ok) continue;

        const html = await response.text();
        const $ = cheerio.load(html);

        let recipe = null;
        $('script[type="application/ld+json"]').each((i, el) => {
          try {
            const data = JSON.parse($(el).html());
            if (data['@graph']) {
              recipe = data['@graph'].find(item => item['@type'] === 'Recipe');
            } else if (Array.isArray(data)) {
              recipe = data.find(item => item['@type'] === 'Recipe');
            } else if (data['@type'] === 'Recipe') {
              recipe = data;
            }
          } catch (e) {}
        });

        if (recipe) {
          const ingredients = (recipe.recipeIngredient || []).map(ing => parseIngredientString(ing));

          recipes.push({
            title: recipe.name || 'Untitled Recipe',
            description: recipe.description || '',
            image_url: extractImage(recipe.image),
            prep_time: parseISO8601Duration(recipe.prepTime),
            cook_time: parseISO8601Duration(recipe.cookTime),
            servings: parseServings(recipe.recipeYield),
            ingredients: ingredients.map(ing => ({
              name: ing.name,
              amount: ing.amount,
              unit: ing.unit,
              estimated_price: 2.50
            })),
            instructions: parseInstructions(recipe.recipeInstructions),
            cuisines: recipe.recipeCuisine ? [].concat(recipe.recipeCuisine) : [],
            diets: [],
            source_url: url,
            total_cost: ingredients.length * 2.50
          });
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.error(`Failed to parse ${url}:`, e.message);
      }
    }

    res.json({
      success: true,
      recipes,
      count: recipes.length,
      category: selectedCategory
    });
  } catch (error) {
    console.error('Recipe discovery error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '4.0.0',
    dry_run: DRY_RUN,
    features: [
      'recipe-parsing',
      'kroger-pricing',
      'product-search',
      'recipe-discovery',
      'price-search',
      'instacart-recipe',
      'instacart-shopping-list',
      'instacart-retailers',
      'instacart-caching'
    ],
    instacart: {
      configured: !!INSTACART_API_KEY,
      api_url: INSTACART_API_URL
    },
    kroger: {
      configured: !!(KROGER_CLIENT_ID && KROGER_CLIENT_SECRET)
    },
    supabase: {
      configured: !!supabase,
      caching: !!supabase
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`DishDollar API v4.0.0 running on port ${PORT}`);
  console.log(`Instacart API: ${INSTACART_API_URL}`);
  console.log(`Dry run mode: ${DRY_RUN ? 'ENABLED' : 'disabled'}`);
  console.log(`Supabase caching: ${supabase ? 'enabled' : 'disabled'}`);
});
