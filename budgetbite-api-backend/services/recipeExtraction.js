const cheerio = require('cheerio');
const { USER_AGENT } = require('./recipeDiscovery');

const FIRECRAWL_API_BASE = 'https://api.firecrawl.dev/v1';

// Firecrawl extraction schema for recipe data
const RECIPE_EXTRACT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'The recipe title/name' },
    ingredients: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of ingredients with quantities, e.g. "2 cups flour"'
    },
    instructions: {
      type: 'array',
      items: { type: 'string' },
      description: 'Step-by-step cooking instructions'
    },
    prep_time_minutes: { type: 'number', description: 'Preparation time in minutes' },
    cook_time_minutes: { type: 'number', description: 'Cooking time in minutes' },
    total_time_minutes: { type: 'number', description: 'Total time in minutes' },
    servings: { type: 'number', description: 'Number of servings' },
    cuisine: { type: 'string', description: 'Cuisine type (e.g. Italian, Mexican, Thai)' },
    diet_tags: {
      type: 'array',
      items: { type: 'string' },
      description: 'Dietary tags like vegan, gluten-free, dairy-free'
    },
    author: { type: 'string', description: 'Recipe author name' }
  },
  required: ['title', 'ingredients', 'instructions']
};

/**
 * Extract recipe data from a URL using Firecrawl
 * Falls back to Cheerio JSON-LD extraction on failure
 */
async function extractRecipeFromUrl(url) {
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  const DRY_RUN = process.env.DRY_RUN === 'true';

  if (DRY_RUN) {
    console.log(`[Extraction] DRY_RUN: Would extract from ${url}`);
    return buildResult(url, {
      title: `[DRY RUN] Recipe from ${new URL(url).hostname}`,
      ingredients: ['2 cups flour', '1 cup sugar', '2 eggs', '1 cup milk'],
      instructions: ['Mix dry ingredients.', 'Add wet ingredients.', 'Cook until done.'],
      prep_time_minutes: 15,
      cook_time_minutes: 30,
      servings: 4,
      author: 'DRY RUN'
    }, 'dry_run');
  }

  // Try Firecrawl first
  if (firecrawlKey) {
    try {
      console.log(`[Extraction] Firecrawl: extracting ${url}`);
      const result = await extractWithFirecrawl(url, firecrawlKey);
      if (result) return result;
      console.log('[Extraction] Firecrawl returned no data, falling back to Cheerio');
    } catch (error) {
      console.error(`[Extraction] Firecrawl failed: ${error.message}, falling back to Cheerio`);
    }
  }

  // Fallback: Cheerio JSON-LD extraction
  try {
    console.log(`[Extraction] Cheerio fallback: extracting ${url}`);
    return await extractWithCheerio(url);
  } catch (error) {
    console.error(`[Extraction] Cheerio fallback also failed for ${url}: ${error.message}`);
    return null;
  }
}

/**
 * Extract recipe using Firecrawl's scrape + extract API
 */
async function extractWithFirecrawl(url, apiKey) {
  const response = await fetch(`${FIRECRAWL_API_BASE}/scrape`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      url,
      formats: ['extract'],
      extract: {
        prompt: 'Extract the recipe data from this page. Focus on the complete list of ingredients with quantities, step-by-step cooking instructions, preparation and cooking times, number of servings, and the recipe author. Do NOT extract blog content, personal stories, photos, or advertisements.',
        schema: RECIPE_EXTRACT_SCHEMA
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firecrawl API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const extracted = data.data?.extract;

  if (!extracted || !extracted.title || !extracted.ingredients?.length) {
    return null;
  }

  return buildResult(url, extracted, 'firecrawl');
}

/**
 * Fallback: extract recipe using Cheerio + JSON-LD Schema.org parsing
 * This mirrors the existing logic in server.js POST /api/recipe/parse
 */
async function extractWithCheerio(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT }
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
      // Continue to next script tag
    }
  });

  if (!recipe) {
    throw new Error('No JSON-LD recipe data found');
  }

  // Parse instructions from various JSON-LD formats
  let instructions = [];
  if (recipe.recipeInstructions) {
    if (typeof recipe.recipeInstructions === 'string') {
      instructions = recipe.recipeInstructions.split(/\n|(?:\d+\.\s)/).map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(recipe.recipeInstructions)) {
      instructions = recipe.recipeInstructions.map(item => {
        if (typeof item === 'string') return item;
        if (item['@type'] === 'HowToStep') return item.text || item.name;
        if (item['@type'] === 'HowToSection') {
          return item.itemListElement?.map(step => step.text || step.name).filter(Boolean) || [];
        }
        return item.text || item.name || '';
      }).flat().filter(Boolean);
    }
  }

  // Parse ISO 8601 duration (PT30M -> 30)
  function parseDuration(duration) {
    if (!duration) return null;
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return null;
    return parseInt(match[1] || 0) * 60 + parseInt(match[2] || 0);
  }

  // Parse servings
  function parseServings(recipeYield) {
    if (!recipeYield) return null;
    if (typeof recipeYield === 'number') return recipeYield;
    const match = String(recipeYield).match(/\d+/);
    return match ? parseInt(match[0]) : null;
  }

  const extracted = {
    title: recipe.name || 'Untitled Recipe',
    ingredients: recipe.recipeIngredient || [],
    instructions,
    prep_time_minutes: parseDuration(recipe.prepTime),
    cook_time_minutes: parseDuration(recipe.cookTime),
    total_time_minutes: parseDuration(recipe.totalTime),
    servings: parseServings(recipe.recipeYield),
    cuisine: recipe.recipeCuisine
      ? (Array.isArray(recipe.recipeCuisine) ? recipe.recipeCuisine[0] : recipe.recipeCuisine)
      : null,
    diet_tags: recipe.suitableForDiet
      ? [].concat(recipe.suitableForDiet).map(d => d.replace('https://schema.org/', '').replace('Diet', ''))
      : [],
    author: recipe.author?.name || (typeof recipe.author === 'string' ? recipe.author : null)
  };

  return buildResult(url, extracted, 'cheerio');
}

/**
 * Build a standardized result object from extracted data
 */
function buildResult(url, extracted, method) {
  const domain = new URL(url).hostname.replace(/^www\./, '');

  return {
    title: extracted.title,
    ingredients: extracted.ingredients || [],
    instructions: extracted.instructions || [],
    prep_time: extracted.prep_time_minutes || null,
    cook_time: extracted.cook_time_minutes || null,
    total_time: extracted.total_time_minutes || null,
    servings: extracted.servings || null,
    cuisine: extracted.cuisine || null,
    diet_tags: extracted.diet_tags || [],
    author: extracted.author || null,
    source_url: url,
    source_domain: domain,
    extraction_method: method
  };
}

module.exports = {
  extractRecipeFromUrl
};
