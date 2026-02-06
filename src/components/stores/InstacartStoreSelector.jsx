import React, { useState, useEffect, useCallback } from 'react';
import { Store, Check, Loader2, MapPin, AlertCircle } from 'lucide-react';

// Store icons for display
const storeIcons = {
  'Walmart': '🏪',
  'Kroger': '🛒',
  'Whole Foods': '🥬',
  "Trader Joe's": '🌻',
  'Costco': '📦',
  'Safeway': '🛍️',
  'Publix': '🍊',
  'Aldi': '💰',
  'Target': '🎯',
  'HEB': '🤠',
  'Wegmans': '🥗',
  'Sprouts': '🌱',
  'Food Lion': '🦁',
  'Albertsons': '🏬',
  'Meijer': '🌟',
  'WinCo': '🏷️',
  'Grocery Outlet': '🎪',
  'Other': '🏠'
};

/**
 * InstacartStoreSelector - Fetches nearby stores via Instacart IDP API
 * Falls back to static store list if API unavailable
 *
 * @param {string} zipCode - User's ZIP code for store lookup
 * @param {function} onStoreSelect - Callback when store is selected (receives store name)
 * @param {string[]} fallbackStores - Static list of store names to use as fallback
 * @param {string} selectedStore - Currently selected store name
 * @param {string} className - Additional CSS classes
 */
export default function InstacartStoreSelector({
  zipCode,
  onStoreSelect,
  fallbackStores = [],
  selectedStore = '',
  className = ''
}) {
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  // Fetch stores from Instacart API based on ZIP code
  const fetchNearbyStores = useCallback(async (zip) => {
    if (!zip || zip.length !== 5) {
      // Use fallback stores if no valid ZIP
      setStores(fallbackStores.map(name => ({ name, isNearby: false })));
      setUsingFallback(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual Instacart IDP API call when API key is available
      // POST /idp/v1/stores/nearby with { postal_code: zip }
      const apiKey = import.meta.env.VITE_INSTACART_API_KEY;

      if (!apiKey) {
        // No API key configured, use fallback stores
        throw new Error('Instacart API not configured');
      }

      // Instacart IDP API endpoint (placeholder - update when API access granted)
      const response = await fetch('https://api.instacart.com/idp/v1/stores/nearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          postal_code: zip,
          limit: 20
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Map Instacart response to our store format
      const nearbyStores = data.stores?.map(store => ({
        name: store.retailer_name || store.name,
        id: store.id,
        address: store.address,
        distance: store.distance,
        isNearby: true,
        instacartEnabled: true
      })) || [];

      if (nearbyStores.length > 0) {
        setStores(nearbyStores);
        setUsingFallback(false);
      } else {
        throw new Error('No stores found nearby');
      }
    } catch (err) {
      console.log('Instacart API unavailable, using fallback stores:', err.message);

      // Use fallback stores with regional sorting based on ZIP
      const sortedFallback = sortStoresByRegion(fallbackStores, zip);
      setStores(sortedFallback.map(name => ({ name, isNearby: false })));
      setUsingFallback(true);

      // Only show error if it's not a configuration issue
      if (err.message !== 'Instacart API not configured') {
        setError('Showing popular stores in your area');
      }
    } finally {
      setIsLoading(false);
    }
  }, [fallbackStores]);

  // Sort fallback stores by region based on ZIP code prefix
  const sortStoresByRegion = (storeNames, zip) => {
    if (!zip) return storeNames;

    // ZIP code prefix to region mapping (simplified)
    const zipPrefix = parseInt(zip.substring(0, 3));

    // Regional store priorities based on ZIP ranges
    const regionalPriority = {};

    // Northeast (000-099)
    if (zipPrefix < 100) {
      regionalPriority['Wegmans'] = 1;
      regionalPriority['Whole Foods'] = 2;
      regionalPriority['Stop & Shop'] = 3;
    }
    // Southeast (200-399)
    else if (zipPrefix >= 200 && zipPrefix < 400) {
      regionalPriority['Publix'] = 1;
      regionalPriority['Food Lion'] = 2;
      regionalPriority['Kroger'] = 3;
    }
    // Midwest (400-599)
    else if (zipPrefix >= 400 && zipPrefix < 600) {
      regionalPriority['Kroger'] = 1;
      regionalPriority['Meijer'] = 2;
      regionalPriority['Aldi'] = 3;
    }
    // Texas (750-799)
    else if (zipPrefix >= 750 && zipPrefix < 800) {
      regionalPriority['HEB'] = 1;
      regionalPriority['Kroger'] = 2;
      regionalPriority['Walmart'] = 3;
    }
    // West (800-999)
    else if (zipPrefix >= 800) {
      regionalPriority['Safeway'] = 1;
      regionalPriority['Albertsons'] = 2;
      regionalPriority['WinCo'] = 3;
      regionalPriority['Sprouts'] = 4;
    }

    // Always include nationwide stores with lower priority
    regionalPriority['Walmart'] = regionalPriority['Walmart'] || 10;
    regionalPriority['Target'] = regionalPriority['Target'] || 11;
    regionalPriority['Costco'] = regionalPriority['Costco'] || 12;
    regionalPriority['Whole Foods'] = regionalPriority['Whole Foods'] || 13;

    return [...storeNames].sort((a, b) => {
      const priorityA = regionalPriority[a] || 50;
      const priorityB = regionalPriority[b] || 50;
      return priorityA - priorityB;
    });
  };

  // Fetch stores when ZIP code changes
  useEffect(() => {
    fetchNearbyStores(zipCode);
  }, [zipCode, fetchNearbyStores]);

  const handleStoreClick = (store) => {
    onStoreSelect(store.name);
  };

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-2" />
        <p className="text-sm text-gray-500">Finding stores near {zipCode}...</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header with location indicator */}
      {zipCode && (
        <div className="flex items-center gap-2 mb-3 text-sm">
          <MapPin className="w-4 h-4 text-green-600" />
          <span className="text-gray-600">
            {usingFallback ? 'Popular stores in your area' : `Stores near ${zipCode}`}
          </span>
          {!usingFallback && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              via Instacart
            </span>
          )}
        </div>
      )}

      {/* Info message */}
      {error && (
        <div className="flex items-center gap-2 mb-3 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Store grid */}
      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
        {stores.map((store) => {
          const icon = storeIcons[store.name] || '🛒';
          const isSelected = selectedStore === store.name;

          return (
            <button
              key={store.name}
              onClick={() => handleStoreClick(store)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border-2 relative
                ${isSelected
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                }`}
            >
              <span className="flex items-center justify-center gap-1">
                <span className="text-base">{icon}</span>
                <span className="truncate">{store.name}</span>
              </span>

              {/* Nearby indicator */}
              {store.isNearby && !isSelected && (
                <span
                  className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full"
                  title="Available near you"
                />
              )}

              {/* Selected checkmark */}
              {isSelected && (
                <Check className="absolute -top-1 -right-1 w-4 h-4 text-green-600" />
              )}

              {/* Distance if available */}
              {store.distance && (
                <span className="block text-xs text-gray-400 mt-0.5">
                  {store.distance} mi
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Instacart attribution */}
      {!usingFallback && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          Powered by Instacart
        </p>
      )}
    </div>
  );
}
