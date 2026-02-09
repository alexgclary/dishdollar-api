import React, { useState, useEffect, useCallback } from 'react';
import { Store, Check, Loader2, MapPin, AlertCircle, ShoppingCart } from 'lucide-react';

// Get API base URL from environment
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://budgetbite-api-69cb51842c10.herokuapp.com';

// Kroger-family store chains (for special handling with Kroger location API)
export const KROGER_FAMILY_RETAILERS = [
  'kroger', 'ralphs', 'king_soopers', 'frys', 'smiths', 'fred_meyer',
  'qfc', 'harris_teeter', 'food_4_less', 'pick_n_save', 'metro_market',
  'marianos', 'dillons', 'bakers', 'city_market', 'gerbes', 'jayc',
  'pay_less', 'owens', 'ruler_foods'
];

// Store icons for display (fallback when no logo available)
const storeIcons = {
  'Walmart': '🏪',
  'Kroger': '🛒',
  'King Soopers': '🛒',
  'Ralphs': '🛒',
  'Fred Meyer': '🛒',
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
  'Grocery Outlet': '🎪'
};

/**
 * InstacartStoreSelector - Fetches nearby retailers via our backend Instacart API
 *
 * @param {string} zipCode - User's ZIP code for retailer lookup
 * @param {function} onStoreSelect - Callback when store is selected
 *   - Called with { name: string, retailer_key: string, logo_url?: string }
 * @param {string[]} fallbackStores - Static list of store names to use as fallback
 * @param {string} selectedStore - Currently selected store name
 * @param {string} selectedRetailerKey - Currently selected retailer key
 * @param {string} className - Additional CSS classes
 */
export default function InstacartStoreSelector({
  zipCode,
  onStoreSelect,
  fallbackStores = [],
  selectedStore = '',
  selectedRetailerKey = '',
  className = ''
}) {
  const [retailers, setRetailers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  // Fetch retailers from our backend Instacart API
  const fetchNearbyRetailers = useCallback(async (zip) => {
    if (!zip || zip.length !== 5) {
      // Use fallback stores if no valid ZIP
      setRetailers(fallbackStores.map(name => ({
        name,
        retailer_key: name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        isNearby: false
      })));
      setUsingFallback(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call our backend API which proxies to Instacart
      const response = await fetch(
        `${API_BASE}/api/instacart/retailers?postal_code=${encodeURIComponent(zip)}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();

      // Map Instacart response to our format
      const nearbyRetailers = (data.retailers || []).map(retailer => ({
        name: retailer.name,
        retailer_key: retailer.retailer_key,
        logo_url: retailer.retailer_logo_url,
        isNearby: true,
        isKrogerFamily: KROGER_FAMILY_RETAILERS.includes(retailer.retailer_key?.toLowerCase())
      }));

      if (nearbyRetailers.length > 0) {
        setRetailers(nearbyRetailers);
        setUsingFallback(false);
      } else {
        throw new Error('No retailers found nearby');
      }
    } catch (err) {
      console.log('Instacart retailers API error, using fallback:', err.message);

      // Use fallback stores with regional sorting based on ZIP
      const sortedFallback = sortStoresByRegion(fallbackStores, zip);
      setRetailers(sortedFallback.map(name => ({
        name,
        retailer_key: name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        isNearby: false
      })));
      setUsingFallback(true);
      setError('Showing popular stores in your area');
    } finally {
      setIsLoading(false);
    }
  }, [fallbackStores]);

  // Sort fallback stores by region based on ZIP code prefix
  const sortStoresByRegion = (storeNames, zip) => {
    if (!zip) return storeNames;

    const zipPrefix = parseInt(zip.substring(0, 3));
    const regionalPriority = {};

    // Northeast (000-099)
    if (zipPrefix < 100) {
      regionalPriority['Wegmans'] = 1;
      regionalPriority['Whole Foods'] = 2;
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
    // Colorado (800-816)
    else if (zipPrefix >= 800 && zipPrefix < 817) {
      regionalPriority['King Soopers'] = 1;
      regionalPriority['Safeway'] = 2;
      regionalPriority['Whole Foods'] = 3;
    }
    // West (800-999)
    else if (zipPrefix >= 800) {
      regionalPriority['Safeway'] = 1;
      regionalPriority['Albertsons'] = 2;
      regionalPriority['WinCo'] = 3;
      regionalPriority['Sprouts'] = 4;
    }

    // Nationwide stores with lower priority
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

  // Fetch retailers when ZIP code changes
  useEffect(() => {
    fetchNearbyRetailers(zipCode);
  }, [zipCode, fetchNearbyRetailers]);

  const handleRetailerClick = (retailer) => {
    // Pass full retailer info to parent
    onStoreSelect({
      name: retailer.name,
      retailer_key: retailer.retailer_key,
      logo_url: retailer.logo_url,
      isKrogerFamily: retailer.isKrogerFamily
    });
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
      <div className="flex items-center gap-2 mb-3 text-sm">
        <MapPin className="w-4 h-4 text-green-600" />
        <span className="text-gray-600">
          {zipCode
            ? (usingFallback ? 'Popular stores in your area' : `Stores delivering to ${zipCode}`)
            : 'Enter ZIP code to see available stores'}
        </span>
        {!usingFallback && zipCode && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
            <ShoppingCart className="w-3 h-3" />
            Instacart
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 mb-3">
        Choose your preferred grocery store for Instacart delivery. Your selection will be remembered for future orders.
      </p>

      {/* Info message */}
      {error && (
        <div className="flex items-center gap-2 mb-3 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Retailer grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
        {retailers.map((retailer) => {
          const icon = storeIcons[retailer.name] || '🛒';
          const isSelected = selectedRetailerKey
            ? selectedRetailerKey === retailer.retailer_key
            : selectedStore === retailer.name;

          return (
            <button
              key={retailer.retailer_key || retailer.name}
              onClick={() => handleRetailerClick(retailer)}
              className={`p-3 rounded-xl text-sm font-medium transition-all border-2 relative flex flex-col items-center gap-2
                ${isSelected
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                }`}
            >
              {/* Logo or icon */}
              {retailer.logo_url ? (
                <img
                  src={retailer.logo_url}
                  alt={retailer.name}
                  className="w-10 h-10 object-contain rounded"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <span
                className={`text-2xl ${retailer.logo_url ? 'hidden' : 'flex'} items-center justify-center w-10 h-10`}
              >
                {icon}
              </span>

              {/* Name */}
              <span className="text-center truncate w-full">{retailer.name}</span>

              {/* Kroger family indicator */}
              {retailer.isKrogerFamily && !isSelected && (
                <span
                  className="absolute -top-1 -right-1 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full"
                  title="Real-time pricing available"
                >
                  $
                </span>
              )}

              {/* Selected checkmark */}
              {isSelected && (
                <Check className="absolute -top-1 -right-1 w-5 h-5 text-white bg-green-500 rounded-full p-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Instacart attribution */}
      {!usingFallback && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          Delivery powered by Instacart
        </p>
      )}
    </div>
  );
}
