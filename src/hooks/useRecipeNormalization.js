import { useState, useCallback, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://budgetbite-api-69cb51842c10.herokuapp.com';

/**
 * Hook for async recipe normalization (AI rewriting).
 * Returns raw recipe immediately, then swaps in normalized version when ready.
 *
 * Usage:
 *   const { normalizedRecipe, isNormalizing, normalize } = useRecipeNormalization();
 *   // After extracting raw recipe:
 *   normalize(rawRecipe); // fires in background
 *   // Use normalizedRecipe when available, otherwise fall back to raw
 */
export function useRecipeNormalization() {
  const [normalizedRecipe, setNormalizedRecipe] = useState(null);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const normalize = useCallback(async (rawRecipe) => {
    if (!rawRecipe?.title || !rawRecipe?.ingredients || !rawRecipe?.instructions) {
      return null;
    }

    // Skip if already rewritten
    if (rawRecipe.rewritten) {
      setNormalizedRecipe(rawRecipe);
      return rawRecipe;
    }

    // Abort any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setIsNormalizing(true);
    setError(null);
    setNormalizedRecipe(null);

    try {
      const response = await fetch(`${API_BASE}/api/recipe/normalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          title: rawRecipe.title,
          ingredients: rawRecipe.ingredients,
          instructions: rawRecipe.instructions,
          source_url: rawRecipe.source_url,
          prep_time: rawRecipe.prep_time,
          cook_time: rawRecipe.cook_time,
          total_time: rawRecipe.total_time,
          servings: rawRecipe.servings,
          cuisine: rawRecipe.cuisines?.[0] || null,
          diet_tags: rawRecipe.diets || rawRecipe.diet_tags || []
        })
      });

      if (!response.ok) {
        throw new Error(`Normalization failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.normalized_recipe) {
        const result = {
          ...rawRecipe,
          ...data.normalized_recipe,
          // Preserve fields that normalization doesn't touch
          image_url: rawRecipe.image_url,
          source_url: rawRecipe.source_url,
          source_name: rawRecipe.source_name,
          author: rawRecipe.author,
          // Pricing data from original parse (if any)
          total_cost: rawRecipe.total_cost,
          pricing: rawRecipe.pricing,
          // Mark as rewritten
          rewritten: data.normalized_recipe.rewritten ?? true,
          cached: data.cached
        };
        setNormalizedRecipe(result);
        setIsNormalizing(false);
        return result;
      }

      throw new Error('No normalized recipe in response');
    } catch (err) {
      if (err.name === 'AbortError') return null;
      console.error('[useRecipeNormalization]', err);
      setError(err.message);
      setIsNormalizing(false);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setNormalizedRecipe(null);
    setIsNormalizing(false);
    setError(null);
  }, []);

  return {
    normalizedRecipe,
    isNormalizing,
    error,
    normalize,
    reset
  };
}
