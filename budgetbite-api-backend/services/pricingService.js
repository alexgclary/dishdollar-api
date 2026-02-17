const crypto = require('crypto');

// Enhanced fallback price dictionary (~80 items)
const FALLBACK_PRICES = {
  // Proteins
  "chicken": 3.99, "chicken breast": 5.99, "chicken thigh": 3.49,
  "beef": 5.99, "ground beef": 4.99, "steak": 9.99,
  "pork": 3.99, "pork chop": 4.49, "bacon": 5.99, "sausage": 3.99,
  "salmon": 9.99, "shrimp": 8.99, "fish": 7.99, "tuna": 1.99,
  "turkey": 4.99, "tofu": 2.49, "egg": 0.30, "eggs": 3.59,

  // Dairy
  "milk": 3.99, "butter": 4.99, "cheese": 4.99, "cream cheese": 2.99,
  "cream": 3.99, "heavy cream": 3.99, "half and half": 2.99,
  "sour cream": 2.49, "yogurt": 1.29, "mozzarella": 3.99, "cheddar": 3.99,

  // Produce
  "onion": 0.75, "garlic": 0.50, "tomato": 0.50, "potato": 0.40,
  "carrot": 0.25, "pepper": 1.29, "bell pepper": 1.29,
  "broccoli": 1.99, "spinach": 2.99, "lettuce": 1.99,
  "avocado": 1.50, "lemon": 0.50, "lime": 0.35,
  "ginger": 0.75, "celery": 1.49, "cucumber": 0.79,
  "mushroom": 2.49, "corn": 0.50, "zucchini": 0.99,
  "jalapeno": 0.25, "sweet potato": 0.99,

  // Herbs & spices
  "cilantro": 0.79, "parsley": 0.79, "basil": 0.99,
  "thyme": 0.99, "rosemary": 0.99, "oregano": 0.10,
  "cumin": 0.10, "paprika": 0.10, "cinnamon": 0.10,
  "chili powder": 0.10, "cayenne": 0.10, "turmeric": 0.10,
  "curry powder": 0.10, "salt": 0.05, "black pepper": 0.05,

  // Grains & starches
  "rice": 2.49, "pasta": 1.49, "flour": 2.99, "bread": 2.99,
  "tortilla": 2.99, "corn tortillas": 2.49, "pita": 2.99, "naan": 3.49,
  "oats": 3.49, "quinoa": 4.99,

  // Canned & pantry
  "broth": 2.49, "beans": 1.19, "tomato sauce": 0.99, "coconut milk": 2.49,
  "lentils": 1.49, "chickpeas": 1.29, "salsa": 2.99,
  "peanut butter": 3.49, "almonds": 5.99, "walnuts": 5.99,

  // Oils & condiments
  "oil": 0.50, "olive oil": 0.50, "coconut oil": 0.50, "sesame oil": 0.50,
  "vinegar": 0.25, "soy sauce": 0.25, "honey": 0.50,
  "hot sauce": 0.25, "mayonnaise": 3.99, "mustard": 2.49,
  "ketchup": 2.99, "worcestershire sauce": 0.25,

  // Baking
  "sugar": 2.99, "brown sugar": 2.99, "maple syrup": 6.99,
  "baking soda": 0.10, "baking powder": 0.10, "vanilla": 0.25
};

// Kroger-family store names
const KROGER_STORES = [
  'kroger', 'ralphs', 'fred meyer', 'king soopers', "smith's", 'smiths',
  "fry's", 'frys', 'harris teeter', 'qfc', 'food 4 less', 'food4less',
  'pick n save', 'picknsave', 'metro market', 'metromarket',
  "mariano's", 'marianos', 'dillons', "baker's", 'bakers', 'city market'
];

// Spoonacular daily rate limit tracking
let spoonacularPointsUsed = 0;
let spoonacularPointsResetAt = Date.now() + 24 * 60 * 60 * 1000;
const SPOONACULAR_DAILY_LIMIT = 140; // 150 max, leave 10 buffer

function resetSpoonacularLimitIfNeeded() {
  if (Date.now() > spoonacularPointsResetAt) {
    spoonacularPointsUsed = 0;
    spoonacularPointsResetAt = Date.now() + 24 * 60 * 60 * 1000;
  }
}

function canUseSpoonacular() {
  resetSpoonacularLimitIfNeeded();
  return spoonacularPointsUsed < SPOONACULAR_DAILY_LIMIT;
}

/**
 * Normalize ingredient name for consistent hashing and lookups
 */
function normalizeIngredientName(name) {
  if (!name || typeof name !== 'string') return '';

  return name
    .toLowerCase()
    .replace(/^[\d\s\/.,-]+/, '')
    .replace(/\(.*?\)/g, '')
    .replace(/,.*$/, '')
    .replace(/\b(for serving|to serve|optional|garnish|to taste|as needed)\b/gi, '')
    .replace(/\b(fresh|frozen|canned|chopped|diced|minced|sliced|shredded|crushed|ground)\b/gi, '')
    .replace(/\b(boneless|skinless|peeled|deveined)\b/gi, '')
    .replace(/\b(cups?|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lbs?|lb|grams?|ml|liters?|cloves?|cans?|packages?|pieces?|slices?|heads?|bunches?|stalks?|sprigs?|large|medium|small|whole|pinch(?:es)?|dash(?:es)?)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate SHA256 hash for an ingredient name (32 chars)
 */
function hashIngredient(normalizedName) {
  return crypto.createHash('sha256')
    .update(normalizedName)
    .digest('hex')
    .substring(0, 32);
}

/**
 * Check if a store name belongs to the Kroger family
 */
function isKrogerFamily(storeName) {
  if (!storeName) return false;
  const lower = storeName.toLowerCase();
  return KROGER_STORES.some(s => lower.includes(s));
}

/**
 * Get a store identifier string for cache keying
 */
function getStoreIdentifier(storeName, storeChain) {
  if (isKrogerFamily(storeName)) {
    return `kroger:${(storeChain || 'KROGER').toUpperCase()}`;
  }
  return 'spoonacular';
}

/**
 * Get store chain identifier from store name (for Kroger API)
 */
function getStoreChain(storeName) {
  if (!storeName) return 'KROGER';
  const upper = storeName.toUpperCase();
  if (upper.includes('KING SOOPERS')) return 'KING_SOOPERS';
  if (upper.includes('RALPHS')) return 'RALPHS';
  if (upper.includes('FRED MEYER')) return 'FRED_MEYER';
  if (upper.includes('SMITH')) return 'SMITHS';
  if (upper.includes('FRY')) return 'FRYS';
  if (upper.includes('HARRIS')) return 'HARRIS_TEETER';
  if (upper.includes('QFC')) return 'QFC';
  if (upper.includes('FOOD 4 LESS')) return 'FOOD_4_LESS';
  if (upper.includes('MARIANO')) return 'MARIANOS';
  if (upper.includes('DILLON')) return 'DILLONS';
  return 'KROGER';
}

/**
 * Batch-check Supabase cache for ingredient prices
 */
async function getCachedPrices(supabase, hashes, zipCode, storeIdentifier) {
  if (!supabase || !hashes.length) return {};

  try {
    const { data, error } = await supabase
      .from('ingredient_prices')
      .select('*')
      .in('ingredient_hash', hashes)
      .eq('zip_code', zipCode)
      .eq('store_identifier', storeIdentifier)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Cache lookup error:', error.message);
      return {};
    }

    const cacheMap = {};
    (data || []).forEach(row => {
      cacheMap[row.ingredient_hash] = row;
    });
    return cacheMap;
  } catch (err) {
    console.error('Cache lookup failed:', err.message);
    return {};
  }
}

/**
 * Cache prices in Supabase via batch upsert
 */
async function cachePrices(supabase, priceRows) {
  if (!supabase || !priceRows.length) return;

  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const rows = priceRows.map(row => ({
      ingredient_name: row.ingredient_name,
      ingredient_hash: row.ingredient_hash,
      zip_code: row.zip_code,
      store_identifier: row.store_identifier,
      price: row.price,
      product_name: row.product_name || null,
      brand: row.brand || null,
      size: row.size || null,
      product_url: row.product_url || null,
      is_on_sale: row.is_on_sale || false,
      source: row.source,
      confidence: row.confidence,
      spoonacular_id: row.spoonacular_id || null,
      expires_at: expiresAt.toISOString()
    }));

    const { error } = await supabase
      .from('ingredient_prices')
      .upsert(rows, {
        onConflict: 'ingredient_hash,zip_code,store_identifier'
      });

    if (error) {
      console.error('Cache write error:', error.message);
    }
  } catch (err) {
    console.error('Cache write failed:', err.message);
  }
}

/**
 * Search Spoonacular for ingredient price
 * Returns { price, productName, spoonacularId, confidence } or null
 */
async function searchSpoonacular(ingredientName, apiKey) {
  if (!apiKey || !canUseSpoonacular()) return null;

  try {
    // Step 1: Search for the ingredient
    const searchUrl = `https://api.spoonacular.com/food/ingredients/search?query=${encodeURIComponent(ingredientName)}&number=1&apiKey=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    spoonacularPointsUsed++;

    if (!searchRes.ok) {
      console.error(`Spoonacular search failed for "${ingredientName}": ${searchRes.status}`);
      return null;
    }

    const searchData = await searchRes.json();
    const result = searchData.results?.[0];

    if (!result) return null;

    // Step 2: Get ingredient info (includes estimatedCost)
    const infoUrl = `https://api.spoonacular.com/food/ingredients/${result.id}/information?amount=1&apiKey=${apiKey}`;
    const infoRes = await fetch(infoUrl);
    spoonacularPointsUsed++;

    if (!infoRes.ok) {
      console.error(`Spoonacular info failed for "${ingredientName}": ${infoRes.status}`);
      return null;
    }

    const infoData = await infoRes.json();

    // estimatedCost is in US Cents
    const costCents = infoData.estimatedCost?.value;
    if (!costCents || costCents <= 0) return null;

    return {
      price: Math.round(costCents) / 100, // Convert cents to dollars
      productName: infoData.name || result.name,
      spoonacularId: result.id,
      confidence: 'medium'
    };
  } catch (err) {
    console.error(`Spoonacular error for "${ingredientName}":`, err.message);
    return null;
  }
}

/**
 * Get fallback price from local dictionary
 */
function getFallbackPrice(normalizedName) {
  // Try exact match first
  if (FALLBACK_PRICES[normalizedName] !== undefined) {
    return { price: FALLBACK_PRICES[normalizedName], confidence: 'low' };
  }

  // Try partial match
  for (const [key, val] of Object.entries(FALLBACK_PRICES)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return { price: val, confidence: 'low' };
    }
  }

  // Default
  return { price: 2.50, confidence: 'low' };
}

/**
 * Main function: Get ingredient prices using tiered strategy
 *
 * @param {Object} deps - Dependencies { supabase, searchKrogerProduct, getKrogerToken, spoonacularApiKey, krogerApiBase }
 * @param {Array} ingredients - [{ name, amount, unit }]
 * @param {Object} options - { zipCode, storeName, storeChain, forceRefresh }
 * @returns {Object} { items, totalCost, source, confidence, cachedCount, freshCount }
 */
async function getIngredientPrices(deps, ingredients, options = {}) {
  const { supabase, searchKrogerProduct, getKrogerToken, spoonacularApiKey, krogerApiBase } = deps;
  const { zipCode = '', storeName = '', storeChain, forceRefresh = false } = options;

  if (!ingredients || !ingredients.length) {
    return { items: [], totalCost: 0, source: 'none', confidence: 'low', cachedCount: 0, freshCount: 0 };
  }

  const resolvedChain = storeChain || getStoreChain(storeName);
  const storeId = getStoreIdentifier(storeName, resolvedChain);
  const useKroger = isKrogerFamily(storeName);
  const effectiveZip = zipCode || '00000';

  // Normalize and hash all ingredients
  const prepared = ingredients.map(ing => {
    const normalized = normalizeIngredientName(ing.name);
    return {
      original: ing.name,
      normalized,
      hash: hashIngredient(normalized),
      amount: ing.amount || 1,
      unit: ing.unit || ''
    };
  });

  // Check cache (unless forceRefresh)
  let cacheMap = {};
  if (!forceRefresh) {
    const hashes = prepared.map(p => p.hash);
    cacheMap = await getCachedPrices(supabase, hashes, effectiveZip, storeId);
  }

  // Split into cached vs uncached
  const cached = [];
  const uncached = [];

  for (const item of prepared) {
    if (cacheMap[item.hash]) {
      cached.push({ ...item, cacheRow: cacheMap[item.hash] });
    } else {
      uncached.push(item);
    }
  }

  // Fetch prices for uncached items
  const freshPrices = [];

  if (uncached.length > 0) {
    // Find Kroger location if needed
    let locationId = null;
    if (useKroger && zipCode && getKrogerToken) {
      try {
        const token = await getKrogerToken();
        const locResponse = await fetch(
          `${krogerApiBase || 'https://api.kroger.com/v1'}/locations?filter.zipCode.near=${zipCode}&filter.radiusInMiles=10&filter.limit=1`,
          { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } }
        );
        if (locResponse.ok) {
          const locData = await locResponse.json();
          locationId = locData.data?.[0]?.locationId;
        }
      } catch (err) {
        console.error('Kroger location lookup failed:', err.message);
      }
    }

    for (const item of uncached) {
      let priceResult = null;

      // Tier 1: Kroger
      if (useKroger && locationId && searchKrogerProduct) {
        try {
          const product = await searchKrogerProduct(item.original, locationId, resolvedChain);
          if (product?.price) {
            priceResult = {
              ingredient_name: item.normalized,
              ingredient_hash: item.hash,
              zip_code: effectiveZip,
              store_identifier: storeId,
              price: product.price,
              product_name: product.name || null,
              brand: product.brand || null,
              size: product.size || null,
              product_url: product.productUrl || null,
              is_on_sale: product.isOnSale || false,
              source: 'kroger',
              confidence: 'high',
              spoonacular_id: null
            };
          }
        } catch (err) {
          console.error(`Kroger search failed for "${item.original}":`, err.message);
        }
        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Tier 2: Spoonacular (for non-Kroger or if Kroger missed)
      if (!priceResult && !useKroger && spoonacularApiKey) {
        const spoonResult = await searchSpoonacular(item.normalized, spoonacularApiKey);
        if (spoonResult) {
          priceResult = {
            ingredient_name: item.normalized,
            ingredient_hash: item.hash,
            zip_code: effectiveZip,
            store_identifier: storeId,
            price: spoonResult.price,
            product_name: spoonResult.productName || null,
            brand: null,
            size: null,
            product_url: null,
            is_on_sale: false,
            source: 'spoonacular',
            confidence: 'medium',
            spoonacular_id: spoonResult.spoonacularId || null
          };
        }
        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      // Tier 3: Fallback
      if (!priceResult) {
        const fallback = getFallbackPrice(item.normalized);
        priceResult = {
          ingredient_name: item.normalized,
          ingredient_hash: item.hash,
          zip_code: effectiveZip,
          store_identifier: storeId,
          price: fallback.price,
          product_name: null,
          brand: null,
          size: null,
          product_url: null,
          is_on_sale: false,
          source: 'fallback',
          confidence: fallback.confidence,
          spoonacular_id: null
        };
      }

      freshPrices.push(priceResult);
    }

    // Cache fresh prices
    await cachePrices(supabase, freshPrices);
  }

  // Build response items
  const items = prepared.map(item => {
    const cachedEntry = cached.find(c => c.hash === item.hash);
    if (cachedEntry) {
      const row = cachedEntry.cacheRow;
      return {
        ingredient: item.original,
        price: parseFloat(row.price),
        productName: row.product_name,
        brand: row.brand,
        size: row.size,
        productUrl: row.product_url,
        isOnSale: row.is_on_sale,
        source: row.source,
        confidence: row.confidence,
        cached: true
      };
    }

    const fresh = freshPrices.find(f => f.ingredient_hash === item.hash);
    if (fresh) {
      return {
        ingredient: item.original,
        price: fresh.price,
        productName: fresh.product_name,
        brand: fresh.brand,
        size: fresh.size,
        productUrl: fresh.product_url,
        isOnSale: fresh.is_on_sale,
        source: fresh.source,
        confidence: fresh.confidence,
        cached: false
      };
    }

    // Should not reach here, but fallback
    return {
      ingredient: item.original,
      price: 2.50,
      productName: null,
      brand: null,
      size: null,
      productUrl: null,
      isOnSale: false,
      source: 'fallback',
      confidence: 'low',
      cached: false
    };
  });

  const totalCost = Math.round(items.reduce((sum, i) => sum + i.price, 0) * 100) / 100;

  // Determine overall confidence
  const highCount = items.filter(i => i.confidence === 'high').length;
  const mediumCount = items.filter(i => i.confidence === 'medium').length;
  const total = items.length;

  let overallConfidence = 'low';
  if (highCount / total > 0.7) overallConfidence = 'high';
  else if ((highCount + mediumCount) / total > 0.4) overallConfidence = 'medium';

  // Determine primary source
  const sourceCount = {};
  items.forEach(i => { sourceCount[i.source] = (sourceCount[i.source] || 0) + 1; });
  const primarySource = Object.entries(sourceCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'fallback';

  return {
    items,
    totalCost,
    source: primarySource,
    confidence: overallConfidence,
    cachedCount: cached.length,
    freshCount: freshPrices.length
  };
}

module.exports = {
  getIngredientPrices,
  normalizeIngredientName,
  hashIngredient,
  isKrogerFamily,
  getStoreIdentifier,
  getStoreChain,
  getFallbackPrice,
  FALLBACK_PRICES
};
