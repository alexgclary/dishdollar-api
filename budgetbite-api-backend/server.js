require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cheerio = require('cheerio');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { discoverRecipeUrls } = require('./services/recipeDiscovery');
const { extractRecipeFromUrl } = require('./services/recipeExtraction');
const { normalizeRecipe } = require('./services/recipeNormalization');
const { getIngredientPrices, FALLBACK_PRICES } = require('./services/pricingService');
const { getPackagePrice, getMultiplePackagePrices } = require('./services/packagePricing');

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
    // Allow DishDollar Vercel preview deployments only
    if (origin.match(/^https:\/\/budgetbite-9jq2[a-z0-9-]*\.vercel\.app$/)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true
}));

app.use(express.json());

// Dry run mode for testing (set DRY_RUN=true to log requests instead of calling APIs)
const DRY_RUN = process.env.DRY_RUN === 'true';

// Rate limiter for pricing endpoints (protects Spoonacular daily quota)
const pricingRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many pricing requests, please wait a minute and try again.' }
});

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

// Scraping pipeline configuration
const GOOGLE_CSE_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Spoonacular API key
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;

// ============================================
// HELPER FUNCTIONS
// ============================================

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
// RECIPE PARSING
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

    // Check for cached normalized version
    if (supabase) {
      const { data: cached } = await supabase
        .from('scraped_recipes')
        .select('*')
        .eq('source_url', url)
        .eq('scrape_status', 'normalized')
        .single();

      if (cached) {
        console.log(`[Parse] Cache hit (normalized) for: ${url}`);
        return res.json({
          success: true,
          cached: true,
          normalized: true,
          recipe: {
            title: cached.title,
            description: cached.description,
            image_url: null,
            prep_time: cached.prep_time,
            cook_time: cached.cook_time,
            total_time: cached.total_time,
            servings: cached.servings,
            ingredients: cached.ingredients,
            instructions: cached.instructions,
            cuisines: cached.cuisines || [],
            source_url: url,
            source_name: cached.source_domain,
            rewritten: true
          }
        });
      }
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

    res.json({ success: true, normalized: false, recipe: parsedRecipe });
  } catch (error) {
    console.error('Recipe parsing error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// UNIFIED LIVE PRICING (Spoonacular + Fallback)
// ============================================

// POST /api/prices/live - Get ingredient prices using tiered strategy
app.post('/api/prices/live', pricingRateLimiter, async (req, res) => {
  try {
    const { ingredients, zipCode, storeName, storeChain, forceRefresh = false } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ success: false, error: 'ingredients array required' });
    }

    if (DRY_RUN) {
      console.log('[Pricing] DRY_RUN - would fetch prices for', ingredients.length, 'ingredients');
      const mockItems = ingredients.map(ing => ({
        ingredient: ing.name,
        price: FALLBACK_PRICES[ing.name?.toLowerCase()] || 2.50,
        productName: null,
        brand: null,
        size: null,
        productUrl: null,
        isOnSale: false,
        source: 'fallback',
        confidence: 'low',
        cached: false
      }));
      return res.json({
        success: true,
        items: mockItems,
        totalCost: mockItems.reduce((sum, i) => sum + i.price, 0),
        source: 'fallback',
        confidence: 'low',
        cachedCount: 0,
        freshCount: mockItems.length,
        fetchedAt: new Date().toISOString()
      });
    }

    const deps = {
      supabase,
      spoonacularApiKey: SPOONACULAR_API_KEY
    };

    const result = await getIngredientPrices(deps, ingredients, {
      zipCode,
      storeName,
      storeChain,
      forceRefresh
    });

    res.json({
      success: true,
      ...result,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Live pricing error:', error);
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

// POST /api/discover-recipes - Discover recipes with cuisine/dietary/budget filters
app.post('/api/discover-recipes', async (req, res) => {
  try {
    const { cuisine, dietary, budget, servings = 4 } = req.body;

    // Map cuisine/dietary params to DISCOVERY_RECIPES category keys
    let selectedCategory = 'budget';
    const dietaryLower = (dietary || '').toLowerCase();
    const cuisineLower = (cuisine || '').toLowerCase();

    if (dietaryLower.includes('vegan') || dietaryLower.includes('vegetarian')) {
      selectedCategory = 'vegan';
    } else if (dietaryLower.includes('keto') || dietaryLower.includes('paleo') || dietaryLower.includes('whole30')) {
      selectedCategory = 'healthy';
    } else if (cuisineLower.includes('italian') || cuisineLower.includes('comfort') || cuisineLower.includes('american')) {
      selectedCategory = 'comfort';
    } else if (cuisineLower.includes('asian') || cuisineLower.includes('thai') || cuisineLower.includes('chinese') || cuisineLower.includes('japanese')) {
      selectedCategory = 'quick';
    } else if (cuisineLower.includes('mexican') || cuisineLower.includes('latin')) {
      selectedCategory = 'budget';
    } else if (budget === 'low') {
      selectedCategory = 'budget';
    }

    const categoryUrls = DISCOVERY_RECIPES[selectedCategory] || DISCOVERY_RECIPES.budget;
    const urlsToFetch = categoryUrls.slice(0, 3);

    const recipes = [];
    for (const url of urlsToFetch) {
      try {
        const extracted = await extractRecipeFromUrl(url);
        if (extracted && extracted.title) {
          recipes.push(extracted);
        }
      } catch (urlError) {
        console.warn(`[discover-recipes] Failed to extract ${url}:`, urlError.message);
      }
    }

    res.json({
      success: true,
      recipes,
      filters_applied: { cuisine, dietary, budget, servings }
    });
  } catch (error) {
    console.error('discover-recipes error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// USER ACCOUNT DELETION
// ============================================

// DELETE /api/users/delete - Account deletion with service role key and body user_id verification
app.delete('/api/users/delete', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.split(' ')[1];

    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Verify JWT and get user identity from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Extra security: confirm the caller can only delete their own account
    const { user_id } = req.body || {};
    if (user_id && user_id !== user.id) {
      return res.status(403).json({ error: 'Forbidden: cannot delete another user\'s account' });
    }

    const userId = user.id;
    console.log(`[Account Deletion] Starting deletion for user ${userId}`);

    // Tables to delete user data from (in order to handle foreign key constraints)
    const tablesToDelete = [
      'shopping_lists',
      'pantry_items',
      'meal_plans',
      'budget_entries',
      'saved_recipes',
      'user_extracted_recipes',
      'recipes',
      'instacart_recipe_links',
      'user_profiles'
    ];

    for (const table of tablesToDelete) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('user_id', userId);

        if (error) {
          console.warn(`[Account Deletion] Warning deleting from ${table}:`, error.message);
        } else {
          console.log(`[Account Deletion] Deleted user data from ${table}`);
        }
      } catch (tableError) {
        console.warn(`[Account Deletion] Error deleting from ${table}:`, tableError.message);
      }
    }

    // Delete the user from Supabase Auth using admin API
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error('[Account Deletion] Error deleting auth user:', deleteUserError);
      return res.status(500).json({
        error: 'Failed to delete authentication account',
        details: deleteUserError.message
      });
    }

    console.log(`[Account Deletion] Successfully deleted user ${userId}`);

    res.json({
      success: true,
      message: 'Account and all associated data have been permanently deleted'
    });

  } catch (error) {
    console.error('[Account Deletion] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// RECIPE SCRAPING PIPELINE (3-Layer System)
// ============================================

// POST /api/scrape-recipes - Run the 3-layer scraping pipeline
app.post('/api/scrape-recipes', async (req, res) => {
  try {
    const {
      query,
      cuisines = [],
      diets = [],
      budget_keywords = [],
      limit = 5,
      layers = ['discover', 'extract', 'normalize']
    } = req.body;

    if (!query && cuisines.length === 0) {
      return res.status(400).json({ error: 'query string or cuisines array required' });
    }

    const maxLimit = Math.min(limit, 10);

    const results = {
      discovered: [],
      extracted: [],
      normalized: [],
      errors: [],
      stats: { discovered: 0, extracted: 0, normalized: 0, failed: 0, cached: 0 }
    };

    // LAYER 1: Discovery
    if (layers.includes('discover')) {
      console.log('[Scraper] Layer 1: Discovering recipe URLs...');
      const discoveredUrls = await discoverRecipeUrls(
        query || cuisines.join(' ') + ' recipe',
        { cuisines, diets, budgetKeywords: budget_keywords, limit: maxLimit }
      );
      results.discovered = discoveredUrls;
      results.stats.discovered = discoveredUrls.length;

      // Check which URLs are already in the database
      if (supabase && discoveredUrls.length > 0) {
        const urls = discoveredUrls.map(d => d.url);
        const { data: existing } = await supabase
          .from('scraped_recipes')
          .select('source_url, scrape_status')
          .in('source_url', urls);

        const existingMap = new Map((existing || []).map(e => [e.source_url, e.scrape_status]));
        results.discovered = discoveredUrls.map(d => ({
          ...d,
          already_scraped: existingMap.has(d.url),
          scrape_status: existingMap.get(d.url) || null
        }));
        results.stats.cached = discoveredUrls.filter(d => existingMap.has(d.url)).length;
      }
    }

    // LAYER 2: Extraction
    if (layers.includes('extract')) {
      const urlsToExtract = results.discovered
        .filter(d => d.robotsAllowed && !d.already_scraped)
        .slice(0, maxLimit);

      console.log(`[Scraper] Layer 2: Extracting ${urlsToExtract.length} recipes...`);

      for (const discovered of urlsToExtract) {
        try {
          const extracted = await extractRecipeFromUrl(discovered.url);
          if (extracted) {
            results.extracted.push(extracted);
            results.stats.extracted++;

            // Store raw extraction in database
            if (supabase) {
              const contentHash = crypto.createHash('sha256')
                .update(JSON.stringify(extracted.ingredients || []))
                .digest('hex');

              await supabase.from('scraped_recipes').upsert({
                source_url: discovered.url,
                source_domain: discovered.domain,
                discovery_query: query || cuisines.join(' '),
                raw_title: extracted.title,
                raw_ingredients: extracted.ingredients,
                raw_instructions: extracted.instructions,
                raw_prep_time: extracted.prep_time,
                raw_cook_time: extracted.cook_time,
                raw_servings: extracted.servings,
                scrape_status: 'extracted',
                extracted_at: new Date().toISOString(),
                source_author: extracted.author,
                robots_txt_allowed: true,
                extraction_method: extracted.extraction_method || 'firecrawl',
                content_hash: contentHash,
                // Provide defaults for NOT NULL columns
                title: extracted.title,
                ingredients: extracted.ingredients,
                instructions: extracted.instructions
              }, { onConflict: 'source_url' });
            }
          }
          // Rate limit between extractions
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`[Scraper] Extraction failed for ${discovered.url}:`, error.message);
          results.errors.push({ url: discovered.url, layer: 'extract', error: error.message });
          results.stats.failed++;
        }
      }
    }

    // LAYER 3: Normalization
    if (layers.includes('normalize')) {
      console.log(`[Scraper] Layer 3: Normalizing ${results.extracted.length} recipes...`);

      for (const extracted of results.extracted) {
        try {
          const normalized = await normalizeRecipe(extracted);
          if (normalized) {
            results.normalized.push(normalized);
            results.stats.normalized++;

            // Update database with normalized data
            if (supabase) {
              await supabase.from('scraped_recipes')
                .update({
                  title: normalized.title,
                  description: normalized.description,
                  ingredients: normalized.ingredients,
                  instructions: normalized.instructions,
                  prep_time: normalized.prep_time,
                  cook_time: normalized.cook_time,
                  total_time: normalized.total_time,
                  servings: normalized.servings,
                  cuisines: normalized.cuisines || [],
                  diets: normalized.diets || [],
                  estimated_cost: normalized.estimated_cost,
                  scrape_status: normalized.normalization_skipped ? 'extracted' : 'normalized',
                  normalized_at: new Date().toISOString(),
                  normalization_model: normalized.normalization_model || null
                })
                .eq('source_url', extracted.source_url);
            }
          }
        } catch (error) {
          console.error(`[Scraper] Normalization failed for ${extracted.title}:`, error.message);
          results.errors.push({ url: extracted.source_url, layer: 'normalize', error: error.message });
          results.stats.failed++;
        }
      }
    }

    console.log(`[Scraper] Pipeline complete: ${JSON.stringify(results.stats)}`);
    res.json({ success: true, ...results });

  } catch (error) {
    console.error('[Scraper] Pipeline error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/scraped-recipes - Retrieve normalized recipes from the database
app.get('/api/scraped-recipes', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { cuisine, diet, limit = 20, offset = 0 } = req.query;
    const parsedLimit = Math.min(parseInt(limit) || 20, 50);
    const parsedOffset = parseInt(offset) || 0;

    let query = supabase
      .from('scraped_recipes')
      .select('*')
      .eq('scrape_status', 'normalized')
      .order('normalized_at', { ascending: false })
      .range(parsedOffset, parsedOffset + parsedLimit - 1);

    if (cuisine) {
      query = query.contains('cuisines', [cuisine]);
    }
    if (diet) {
      query = query.contains('diets', [diet]);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Map to the recipe shape the frontend expects
    const recipes = (data || []).map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      image_url: null, // No images stored (legal compliance)
      prep_time: r.prep_time,
      cook_time: r.cook_time,
      total_time: r.total_time,
      servings: r.servings,
      ingredients: r.ingredients,
      instructions: r.instructions,
      cuisines: r.cuisines || [],
      diets: r.diets || [],
      total_cost: r.estimated_cost,
      source_url: r.source_url,
      source_name: r.source_domain,
      source_author: r.source_author,
      scraped: true
    }));

    res.json({ success: true, recipes, count: recipes.length });
  } catch (error) {
    console.error('[Scraper] Retrieval error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// RECIPE NORMALIZATION (AI Rewriting)
// ============================================

/**
 * POST /api/recipe/normalize
 * Takes raw recipe data and returns AI-rewritten version
 * Caches result in scraped_recipes table for future lookups
 */
app.post('/api/recipe/normalize', async (req, res) => {
  try {
    const { title, ingredients, instructions, source_url, prep_time, cook_time, total_time, servings, cuisine, diet_tags } = req.body;

    if (!title || !ingredients || !instructions) {
      return res.status(400).json({ error: 'title, ingredients, and instructions are required' });
    }

    // Check cache first
    if (supabase && source_url) {
      const { data: cached } = await supabase
        .from('scraped_recipes')
        .select('*')
        .eq('source_url', source_url)
        .eq('scrape_status', 'normalized')
        .single();

      if (cached) {
        console.log(`[Normalize] Cache hit for: ${source_url}`);
        return res.json({
          success: true,
          cached: true,
          normalized_recipe: {
            title: cached.title,
            description: cached.description,
            ingredients: cached.ingredients,
            instructions: cached.instructions,
            prep_time: cached.prep_time,
            cook_time: cached.cook_time,
            total_time: cached.total_time,
            servings: cached.servings,
            cuisines: cached.cuisines || [],
            diets: cached.diets || [],
            estimated_cost: cached.estimated_cost,
            rewritten: true
          }
        });
      }
    }

    // Run normalization
    const rawRecipe = {
      title,
      ingredients,
      instructions,
      prep_time,
      cook_time,
      total_time,
      servings,
      cuisine,
      diet_tags,
      source_url,
      source_domain: source_url ? new URL(source_url).hostname.replace(/^www\./, '') : null
    };

    const normalized = await normalizeRecipe(rawRecipe);

    // Cache in database
    if (supabase && source_url) {
      const contentHash = crypto.createHash('sha256')
        .update(JSON.stringify(ingredients))
        .digest('hex');

      await supabase.from('scraped_recipes').upsert({
        source_url,
        source_domain: rawRecipe.source_domain,
        raw_title: title,
        raw_ingredients: ingredients,
        raw_instructions: instructions,
        raw_prep_time: prep_time,
        raw_cook_time: cook_time,
        raw_servings: servings,
        title: normalized.title,
        description: normalized.description,
        ingredients: normalized.ingredients,
        instructions: normalized.instructions,
        prep_time: normalized.prep_time,
        cook_time: normalized.cook_time,
        total_time: normalized.total_time,
        servings: normalized.servings,
        cuisines: normalized.cuisines || [],
        diets: normalized.diets || [],
        estimated_cost: normalized.estimated_cost,
        scrape_status: normalized.normalization_skipped ? 'extracted' : 'normalized',
        normalized_at: new Date().toISOString(),
        normalization_model: normalized.normalization_model || null,
        extraction_method: 'user_extract',
        content_hash: contentHash,
        discovery_query: 'user_extract'
      }, { onConflict: 'source_url' });
    }

    res.json({
      success: true,
      cached: false,
      normalized_recipe: {
        ...normalized,
        rewritten: !normalized.normalization_skipped
      }
    });
  } catch (error) {
    console.error('[Normalize] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// USER EXTRACTED RECIPES
// ============================================

/**
 * GET /api/extracted-recipes/:userId
 * Fetch a user's extraction history
 */
app.get('/api/extracted-recipes/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { data, error } = await supabase
      .from('user_extracted_recipes')
      .select('*')
      .eq('user_id', userId)
      .order('extracted_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, recipes: data || [] });
  } catch (error) {
    console.error('[Extracted Recipes] Fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/extracted-recipes
 * Save an extracted recipe to user's history
 */
app.post('/api/extracted-recipes', async (req, res) => {
  try {
    const { user_id, recipe_url, recipe_title, recipe_data } = req.body;

    if (!user_id || !recipe_url || !recipe_title) {
      return res.status(400).json({ error: 'user_id, recipe_url, and recipe_title are required' });
    }

    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { data, error } = await supabase
      .from('user_extracted_recipes')
      .upsert({
        user_id,
        recipe_url,
        recipe_title,
        recipe_data: recipe_data || {},
        extracted_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,recipe_url'
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`[Extracted Recipes] Saved "${recipe_title}" for user ${user_id}`);
    res.json({ success: true, recipe: data });
  } catch (error) {
    console.error('[Extracted Recipes] Save error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/extracted-recipes/:recipeId
 * Remove an extracted recipe from history
 */
app.delete('/api/extracted-recipes/:recipeId', async (req, res) => {
  try {
    const { recipeId } = req.params;

    if (!recipeId) {
      return res.status(400).json({ error: 'recipeId is required' });
    }

    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { error } = await supabase
      .from('user_extracted_recipes')
      .delete()
      .eq('id', recipeId);

    if (error) throw error;

    console.log(`[Extracted Recipes] Deleted recipe ${recipeId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('[Extracted Recipes] Delete error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/prices/package-lookup - Get package-based price for a single ingredient
app.post('/api/prices/package-lookup', pricingRateLimiter, async (req, res) => {
  try {
    const { ingredientName } = req.body;
    if (!ingredientName) {
      return res.status(400).json({ success: false, error: 'ingredientName is required' });
    }
    const data = await getPackagePrice(ingredientName);
    res.json({ success: true, package: data });
  } catch (error) {
    console.error('[package-lookup] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/prices/bulk-lookup - Get package-based prices for multiple ingredients
app.post('/api/prices/bulk-lookup', pricingRateLimiter, async (req, res) => {
  try {
    const { ingredients } = req.body;
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ success: false, error: 'ingredients must be a non-empty array' });
    }
    const packages = await getMultiplePackagePrices(ingredients);
    res.json({ success: true, packages, count: packages.length });
  } catch (error) {
    console.error('[bulk-lookup] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '5.0.0',
    dry_run: DRY_RUN,
    features: [
      'recipe-parsing',
      'spoonacular-pricing',
      'unified-pricing',
      'product-search',
      'recipe-discovery',
      'instacart-recipe',
      'instacart-shopping-list',
      'instacart-retailers',
      'instacart-caching',
      'recipe-scraping',
      'ai-normalization'
    ],
    instacart: {
      configured: !!INSTACART_API_KEY,
      api_url: INSTACART_API_URL
    },
    spoonacular: {
      configured: !!SPOONACULAR_API_KEY
    },
    supabase: {
      configured: !!supabase,
      caching: !!supabase
    },
    scraping: {
      google_cse: !!GOOGLE_CSE_API_KEY,
      firecrawl: !!FIRECRAWL_API_KEY,
      anthropic: !!ANTHROPIC_API_KEY
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`DishDollar API v5.0.0 running on port ${PORT}`);
  console.log(`Instacart API: ${INSTACART_API_URL}`);
  console.log(`Dry run mode: ${DRY_RUN ? 'ENABLED' : 'disabled'}`);
  console.log(`Supabase caching: ${supabase ? 'enabled' : 'disabled'}`);
});
