/**
 * Recipe Discovery Service
 * Fetches trending and new recipes from target websites
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://budgetbite-api-69cb51842c10.herokuapp.com';

// Target recipe websites for discovery
export const RECIPE_SOURCES = [
  { name: "Natasha's Kitchen", domain: 'natashaskitchen.com', category: 'comfort' },
  { name: 'Half Baked Harvest', domain: 'halfbakedharvest.com', category: 'creative' },
  { name: 'Budget Bytes', domain: 'budgetbytes.com', category: 'budget' },
  { name: 'Skinnytaste', domain: 'skinnytaste.com', category: 'healthy' },
  { name: 'Minimalist Baker', domain: 'minimalistbaker.com', category: 'vegan' },
  { name: 'Simply Recipes', domain: 'simplyrecipes.com', category: 'classic' },
  { name: 'AllRecipes', domain: 'allrecipes.com', category: 'community' },
  { name: 'Cookie and Kate', domain: 'cookieandkate.com', category: 'vegetarian' },
  { name: 'Love and Lemons', domain: 'loveandlemons.com', category: 'vegetarian' },
  { name: 'Serious Eats', domain: 'seriouseats.com', category: 'technique' },
];

// Curated recipe URLs for discovery (fallback when API is unavailable)
const CURATED_RECIPE_URLS = {
  budget: [
    'https://www.budgetbytes.com/one-pot-creamy-cajun-chicken-pasta/',
    'https://www.budgetbytes.com/slow-cooker-chicken-tikka-masala/',
    'https://www.budgetbytes.com/black-bean-quesadillas/',
    'https://www.budgetbytes.com/greek-turkey-and-rice-skillet/',
    'https://www.budgetbytes.com/easy-pad-thai/',
    'https://www.budgetbytes.com/honey-sriracha-chicken/',
    'https://www.budgetbytes.com/beef-cabbage-stir-fry/',
    'https://www.budgetbytes.com/creamy-spinach-tomato-pasta/',
    'https://www.budgetbytes.com/slow-cooker-salsa-chicken/',
    'https://www.budgetbytes.com/sesame-noodles/',
  ],
  healthy: [
    'https://www.skinnytaste.com/air-fryer-salmon/',
    'https://www.skinnytaste.com/greek-chicken-sheet-pan-dinner/',
    'https://www.skinnytaste.com/cauliflower-fried-rice/',
    'https://www.skinnytaste.com/grilled-lemon-herb-chicken/',
    'https://www.skinnytaste.com/turkey-taco-lettuce-wraps/',
    'https://www.skinnytaste.com/shrimp-and-broccoli-stir-fry/',
    'https://www.skinnytaste.com/baked-chicken-parmesan/',
    'https://www.skinnytaste.com/zucchini-noodles-with-turkey/',
  ],
  comfort: [
    'https://natashaskitchen.com/perfect-beef-stroganoff-recipe/',
    'https://natashaskitchen.com/chicken-alfredo-pasta/',
    'https://natashaskitchen.com/easy-chicken-stir-fry/',
    'https://natashaskitchen.com/baked-mac-and-cheese/',
    'https://natashaskitchen.com/chicken-pot-pie/',
    'https://natashaskitchen.com/meatball-recipe/',
    'https://natashaskitchen.com/lasagna-recipe/',
    'https://natashaskitchen.com/beef-tacos/',
  ],
  creative: [
    'https://www.halfbakedharvest.com/sheet-pan-honey-garlic-salmon/',
    'https://www.halfbakedharvest.com/creamy-tuscan-chicken/',
    'https://www.halfbakedharvest.com/korean-bbq-tacos/',
    'https://www.halfbakedharvest.com/one-pot-lemon-chicken/',
    'https://www.halfbakedharvest.com/thai-peanut-chicken/',
    'https://www.halfbakedharvest.com/crispy-sesame-chicken/',
    'https://www.halfbakedharvest.com/butter-chicken/',
    'https://www.halfbakedharvest.com/mediterranean-chicken/',
  ],
  vegan: [
    'https://minimalistbaker.com/easy-vegan-fried-rice/',
    'https://minimalistbaker.com/1-pot-golden-curry-lentil-soup/',
    'https://minimalistbaker.com/crispy-baked-falafel/',
    'https://minimalistbaker.com/vegan-black-bean-tacos/',
    'https://minimalistbaker.com/thai-peanut-noodles/',
    'https://minimalistbaker.com/easy-vegetable-stir-fry/',
    'https://minimalistbaker.com/chickpea-curry/',
    'https://minimalistbaker.com/mediterranean-bowl/',
  ],
  vegetarian: [
    'https://cookieandkate.com/best-vegetable-lasagna/',
    'https://cookieandkate.com/vegetarian-tacos/',
    'https://cookieandkate.com/spinach-artichoke-pasta/',
    'https://cookieandkate.com/mushroom-stroganoff/',
    'https://loveandlemons.com/vegetarian-chili/',
    'https://loveandlemons.com/caprese-pasta/',
    'https://loveandlemons.com/roasted-vegetable-bowl/',
    'https://loveandlemons.com/stuffed-peppers/',
  ],
};

/**
 * Discover new recipes based on user preferences
 * @param {Object} options - Discovery options
 * @param {string[]} options.cuisines - Preferred cuisines
 * @param {string[]} options.diets - Dietary restrictions
 * @param {string} options.category - Recipe category (budget, healthy, etc.)
 * @param {number} options.limit - Max number of recipes to return
 * @returns {Promise<Object[]>} Array of discovered recipes
 */
export async function discoverRecipes(options = {}) {
  const { cuisines = [], diets = [], category = 'budget', limit = 6 } = options;

  try {
    // First try the backend API for fresh recipes
    const response = await fetch(`${API_BASE}/api/recipes/discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cuisines, diets, category, limit })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.recipes?.length > 0) {
        return data.recipes;
      }
    }
  } catch (error) {
    console.log('Discovery API unavailable, using curated recipes');
  }

  // Fallback: Parse curated URLs
  const urls = getCuratedUrls(category, limit);
  const recipes = await parseMultipleUrls(urls);
  return recipes.filter(r => r !== null);
}

/**
 * Get curated recipe URLs for a category
 */
function getCuratedUrls(category, limit) {
  const categoryUrls = CURATED_RECIPE_URLS[category] || CURATED_RECIPE_URLS.budget;
  const allUrls = [...categoryUrls];

  // Add variety from all other categories
  Object.keys(CURATED_RECIPE_URLS).forEach(cat => {
    if (cat !== category) {
      // Shuffle each category's URLs and add more variety
      const shuffledCat = shuffleArray([...CURATED_RECIPE_URLS[cat]]);
      allUrls.push(...shuffledCat.slice(0, 4));
    }
  });

  // Shuffle all URLs and return up to the limit
  return shuffleArray(allUrls).slice(0, limit);
}

/**
 * Parse multiple recipe URLs
 */
async function parseMultipleUrls(urls) {
  const results = await Promise.allSettled(
    urls.map(url => parseRecipeUrl(url))
  );

  return results
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value);
}

/**
 * Parse a single recipe URL
 */
export async function parseRecipeUrl(url) {
  try {
    const response = await fetch(`${API_BASE}/api/recipe/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.success) return null;

    return {
      ...data.recipe,
      source_url: url,
      source_site: extractDomain(url),
      discovered_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Failed to parse ${url}:`, error);
    return null;
  }
}

/**
 * Get trending recipes (mock for now, would connect to analytics in production)
 */
export async function getTrendingRecipes(limit = 6) {
  // In production, this would query analytics for most-viewed recipes
  return discoverRecipes({ category: 'comfort', limit });
}

/**
 * Get recipes matching user's dietary preferences
 */
export async function getPersonalizedRecipes(userProfile, limit = 6) {
  const category = mapDietsToCategory(userProfile?.dietary_restrictions || []);
  return discoverRecipes({
    cuisines: userProfile?.cuisines || [],
    diets: userProfile?.dietary_restrictions || [],
    category,
    limit
  });
}

/**
 * Map dietary restrictions to recipe category
 */
function mapDietsToCategory(diets) {
  if (diets.includes('Vegan')) return 'vegan';
  if (diets.includes('Vegetarian')) return 'vegetarian';
  if (diets.includes('Keto') || diets.includes('Low-Carb')) return 'healthy';
  if (diets.includes('Whole30') || diets.includes('Paleo')) return 'healthy';
  if (diets.includes('Pescatarian')) return 'healthy';
  // Randomly pick a category for variety when no specific diet
  const categories = ['budget', 'comfort', 'creative', 'healthy'];
  return categories[Math.floor(Math.random() * categories.length)];
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

/**
 * Shuffle array randomly
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Discover recipes using the 3-layer scraping pipeline
 * Falls back to curated recipes if the scraping endpoint is unavailable
 */
export async function discoverScrapedRecipes(query, options = {}) {
  try {
    const response = await fetch(`${API_BASE}/api/scrape-recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        cuisines: options.cuisines || [],
        diets: options.diets || [],
        budget_keywords: options.budgetKeywords || [],
        limit: options.limit || 5
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.normalized?.length > 0) {
        return data.normalized;
      }
    }
  } catch (error) {
    console.log('Scraping API unavailable, falling back to curated recipes');
  }

  return discoverRecipes(options);
}

/**
 * Fetch previously scraped and normalized recipes from the database
 */
export async function getScrapedRecipes(options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.cuisine) params.set('cuisine', options.cuisine);
    if (options.diet) params.set('diet', options.diet);
    if (options.limit) params.set('limit', String(options.limit));
    if (options.offset) params.set('offset', String(options.offset));

    const response = await fetch(`${API_BASE}/api/scraped-recipes?${params}`);
    if (response.ok) {
      const data = await response.json();
      return data.recipes || [];
    }
  } catch (error) {
    console.log('Failed to fetch scraped recipes:', error);
  }
  return [];
}

export default {
  discoverRecipes,
  discoverScrapedRecipes,
  getScrapedRecipes,
  getTrendingRecipes,
  getPersonalizedRecipes,
  parseRecipeUrl,
  RECIPE_SOURCES
};
