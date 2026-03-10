const Anthropic = require('@anthropic-ai/sdk');

const NORMALIZATION_MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 4096;

let anthropicClient = null;

function getAnthropicClient() {
  if (!anthropicClient && process.env.ANTHROPIC_API_KEY) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

const SYSTEM_PROMPT = `You are a culinary data processor for a recipe app. Your job is to take raw recipe data and produce standardized, original cooking instructions. You must:

1. REWRITE cooking instructions to be clear, concise, and standardized. Each step should:
   - Start with an action verb
   - Include specific temperatures, times, and measurements
   - Be functional and practical (no storytelling or filler)
   - Be ORIGINAL text (not copied verbatim from the source)

2. STANDARDIZE the ingredient list into structured objects with separate name, amount, and unit fields.

3. GENERATE a brief, original 1-2 sentence description of the dish based on the ingredients and cooking method. Do NOT copy the source description.

4. IDENTIFY cuisine type and dietary tags based on the ingredients and techniques used.

5. ESTIMATE a rough cost category: budget ($5-10 for 4-6 main ingredients), moderate ($10-20 for 7-12 ingredients), premium ($20+ for 13+ ingredients or specialty items).

You must output valid JSON only, with no additional text, markdown formatting, or code fences.`;

/**
 * Build the user prompt for recipe normalization
 */
function buildUserPrompt(rawRecipe) {
  return `Process this raw recipe data into standardized format:

Title: ${rawRecipe.title}
Ingredients: ${JSON.stringify(rawRecipe.ingredients)}
Instructions: ${JSON.stringify(rawRecipe.instructions)}
Prep Time: ${rawRecipe.prep_time || 'unknown'} minutes
Cook Time: ${rawRecipe.cook_time || 'unknown'} minutes
Servings: ${rawRecipe.servings || 'unknown'}
Cuisine: ${rawRecipe.cuisine || 'unknown'}
Diet Tags: ${JSON.stringify(rawRecipe.diet_tags || [])}

Output this exact JSON structure:
{
  "title": "string - clean recipe title",
  "description": "string - original 1-2 sentence description",
  "ingredients": [
    {
      "name": "string - ingredient name only (e.g. 'all-purpose flour')",
      "amount": "number",
      "unit": "string - measurement unit (e.g. 'cup', 'tbsp', 'lb')",
      "display_text": "string - full display text (e.g. '2 cups all-purpose flour')"
    }
  ],
  "instructions": ["string - each step as a clear, original instruction"],
  "prep_time": "number or null",
  "cook_time": "number or null",
  "total_time": "number or null",
  "servings": "number",
  "cuisines": ["string - cuisine tags"],
  "diets": ["string - dietary tags like 'vegan', 'gluten-free'"],
  "estimated_cost": "number - rough cost estimate in USD"
}`;
}

/**
 * Normalize a raw recipe using Claude API
 * Returns standardized recipe data, or the raw data as-is on failure
 */
async function normalizeRecipe(rawRecipe) {
  const DRY_RUN = process.env.DRY_RUN === 'true';

  if (DRY_RUN) {
    console.log(`[Normalization] DRY_RUN: Would normalize "${rawRecipe.title}"`);
    return {
      title: `[DRY RUN] ${rawRecipe.title}`,
      description: 'A delicious recipe ready to be normalized.',
      ingredients: (rawRecipe.ingredients || []).map(ing => ({
        name: typeof ing === 'string' ? ing : ing.name || 'ingredient',
        amount: 1,
        unit: '',
        display_text: typeof ing === 'string' ? ing : ing.display_text || ing.name
      })),
      instructions: rawRecipe.instructions || [],
      prep_time: rawRecipe.prep_time,
      cook_time: rawRecipe.cook_time,
      total_time: rawRecipe.total_time || (rawRecipe.prep_time || 0) + (rawRecipe.cook_time || 0) || null,
      servings: rawRecipe.servings || 4,
      cuisines: rawRecipe.cuisine ? [rawRecipe.cuisine] : [],
      diets: rawRecipe.diet_tags || [],
      estimated_cost: 12.00,
      source_url: rawRecipe.source_url,
      source_domain: rawRecipe.source_domain,
      normalization_skipped: true
    };
  }

  const client = getAnthropicClient();
  if (!client) {
    console.log('[Normalization] Anthropic API not configured, returning raw data');
    return fallbackNormalization(rawRecipe);
  }

  try {
    console.log(`[Normalization] Normalizing: "${rawRecipe.title}"`);

    const message = await client.messages.create({
      model: NORMALIZATION_MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(rawRecipe)
        }
      ],
      system: SYSTEM_PROMPT
    });

    const responseText = message.content[0]?.text;
    if (!responseText) {
      throw new Error('Empty response from Claude API');
    }

    // Parse JSON from response (handle potential markdown code fences)
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Try extracting JSON from code fences
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        throw new Error('Could not parse JSON from Claude response');
      }
    }

    // Validate required fields
    if (!parsed.title || !parsed.ingredients || !parsed.instructions) {
      throw new Error('Missing required fields in normalized response');
    }

    console.log(`[Normalization] Success: "${parsed.title}" (${parsed.ingredients.length} ingredients, ${parsed.instructions.length} steps)`);

    return {
      ...parsed,
      source_url: rawRecipe.source_url,
      source_domain: rawRecipe.source_domain,
      normalization_model: NORMALIZATION_MODEL
    };
  } catch (error) {
    console.error(`[Normalization] Failed for "${rawRecipe.title}": ${error.message}`);

    // On 429 rate limit, retry once after 2 seconds
    if (error.status === 429) {
      console.log('[Normalization] Rate limited, retrying in 2s...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      try {
        const retryMessage = await client.messages.create({
          model: NORMALIZATION_MODEL,
          max_tokens: MAX_TOKENS,
          messages: [{ role: 'user', content: buildUserPrompt(rawRecipe) }],
          system: SYSTEM_PROMPT
        });
        const retryText = retryMessage.content[0]?.text;
        const retryParsed = JSON.parse(retryText);
        return {
          ...retryParsed,
          source_url: rawRecipe.source_url,
          source_domain: rawRecipe.source_domain,
          normalization_model: NORMALIZATION_MODEL
        };
      } catch (retryError) {
        console.error(`[Normalization] Retry also failed: ${retryError.message}`);
      }
    }

    return fallbackNormalization(rawRecipe);
  }
}

/**
 * Fallback: return raw data in normalized shape without AI processing
 */
function fallbackNormalization(rawRecipe) {
  return {
    title: rawRecipe.title,
    description: null,
    ingredients: (rawRecipe.ingredients || []).map(ing => {
      if (typeof ing === 'string') {
        return { name: ing, amount: 1, unit: '', display_text: ing };
      }
      return {
        name: ing.name || 'ingredient',
        amount: ing.amount || 1,
        unit: ing.unit || '',
        display_text: ing.display_text || ing.original || ing.name
      };
    }),
    instructions: rawRecipe.instructions || [],
    prep_time: rawRecipe.prep_time,
    cook_time: rawRecipe.cook_time,
    total_time: rawRecipe.total_time || (rawRecipe.prep_time || 0) + (rawRecipe.cook_time || 0) || null,
    servings: rawRecipe.servings || 4,
    cuisines: rawRecipe.cuisine ? [rawRecipe.cuisine] : [],
    diets: rawRecipe.diet_tags || [],
    estimated_cost: null,
    source_url: rawRecipe.source_url,
    source_domain: rawRecipe.source_domain,
    normalization_skipped: true
  };
}

module.exports = {
  normalizeRecipe
};
