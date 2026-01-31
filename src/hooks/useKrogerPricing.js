import { useState, useEffect, useCallback } from 'react';
import { hasRealTimePricing, getRecipePricing } from '@/components/utils/pricingDatabase';

const API_BASE = 'https://budgetbite-api-69cb51842c10.herokuapp.com';

/**
 * Hook for fetching real-time Kroger pricing for ingredients
 */
export function useKrogerPricing(ingredients, userProfile, options = {}) {
  const [pricing, setPricing] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const { autoFetch = false, cacheTime = 5 * 60 * 1000 } = options;

  const fetchPricing = useCallback(async () => {
    if (!ingredients?.length) {
      setPricing(null);
      return null;
    }

    // Check if we have cached pricing that's still valid
    if (lastFetched && pricing && (Date.now() - lastFetched) < cacheTime) {
      return pricing;
    }

    setIsLoading(true);
    setError(null);

    try {
      const storeName = userProfile?.preferred_store;
      const supportsRealTime = hasRealTimePricing(storeName);

      if (supportsRealTime && userProfile?.location?.zip_code) {
        // Try to get real-time Kroger prices
        const response = await fetch(`${API_BASE}/api/prices/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ingredients: ingredients.map(i => ({
              name: i.name,
              amount: i.amount,
              unit: i.unit
            })),
            zipCode: userProfile.location.zip_code,
            storeChain: getStoreChain(storeName)
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const result = {
              items: data.items || [],
              totalCost: data.totalCost || 0,
              source: 'kroger',
              confidence: 'high',
              fetchedAt: new Date().toISOString()
            };
            setPricing(result);
            setLastFetched(Date.now());
            return result;
          }
        }
      }

      // Fallback to estimated pricing
      const estimated = await getRecipePricing(ingredients, userProfile);
      const result = {
        items: ingredients.map((ing, i) => ({
          ingredient: ing.name,
          price: estimated.breakdown?.[i]?.estimatedPrice || ing.estimated_price || 2.50,
          source: 'estimated'
        })),
        totalCost: estimated.totalCost || ingredients.reduce((sum, i) => sum + (i.estimated_price || 2.50), 0),
        source: 'estimated',
        confidence: estimated.confidence || 'low',
        fetchedAt: new Date().toISOString()
      };
      setPricing(result);
      setLastFetched(Date.now());
      return result;
    } catch (err) {
      console.error('Pricing fetch error:', err);
      setError(err.message || 'Failed to fetch pricing');

      // Return fallback pricing on error
      const fallback = {
        items: ingredients.map(ing => ({
          ingredient: ing.name,
          price: ing.estimated_price || 2.50,
          source: 'fallback'
        })),
        totalCost: ingredients.reduce((sum, i) => sum + (i.estimated_price || 2.50), 0),
        source: 'fallback',
        confidence: 'low',
        fetchedAt: new Date().toISOString()
      };
      setPricing(fallback);
      return fallback;
    } finally {
      setIsLoading(false);
    }
  }, [ingredients, userProfile, cacheTime, lastFetched, pricing]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && ingredients?.length) {
      fetchPricing();
    }
  }, [autoFetch, ingredients?.length]);

  const refresh = useCallback(() => {
    setLastFetched(null);
    return fetchPricing();
  }, [fetchPricing]);

  return {
    pricing,
    isLoading,
    error,
    fetchPricing,
    refresh,
    hasRealTimePricing: hasRealTimePricing(userProfile?.preferred_store)
  };
}

// Helper to get store chain identifier
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

export default useKrogerPricing;
