import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Check, Loader2, AlertCircle, Navigation } from 'lucide-react';

// Get API base URL from environment
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://budgetbite-api-69cb51842c10.herokuapp.com';

/**
 * KrogerLocationSelector - Fetches specific Kroger store locations via our backend
 * Shows actual store addresses for Kroger-family stores
 *
 * @param {string} zipCode - User's ZIP code for store lookup
 * @param {string} storeName - Display name of the Kroger-family store (e.g., "King Soopers")
 * @param {function} onLocationSelect - Callback when a location is selected
 *   - Called with { locationId: string, name: string, address: object, chain: string }
 * @param {string} selectedLocationId - Currently selected location ID
 * @param {string} className - Additional CSS classes
 */
export default function KrogerLocationSelector({
  zipCode,
  storeName,
  onLocationSelect,
  selectedLocationId = '',
  className = ''
}) {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Kroger locations from our backend
  const fetchKrogerLocations = useCallback(async (zip) => {
    if (!zip || zip.length !== 5) {
      setLocations([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/kroger/locations?zip=${encodeURIComponent(zip)}&radius=15`,
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

      // Filter to only show locations matching the selected chain (if available)
      let filteredLocations = data.locations || [];

      // If we have a store name, try to match chain
      if (storeName && filteredLocations.length > 0) {
        const storeNameLower = storeName.toLowerCase().replace(/[^a-z]/g, '');
        const chainFiltered = filteredLocations.filter(loc => {
          const chainLower = (loc.chain || loc.name || '').toLowerCase().replace(/[^a-z]/g, '');
          return chainLower.includes(storeNameLower) || storeNameLower.includes(chainLower);
        });
        // Only use filtered if we found matches, otherwise show all
        if (chainFiltered.length > 0) {
          filteredLocations = chainFiltered;
        }
      }

      setLocations(filteredLocations);

      if (filteredLocations.length === 0) {
        setError(`No ${storeName || 'Kroger'} stores found nearby. Showing all Kroger-family stores.`);
      }
    } catch (err) {
      console.error('Kroger locations API error:', err.message);
      setError('Unable to load store locations. You can still proceed without selecting a specific store.');
      setLocations([]);
    } finally {
      setIsLoading(false);
    }
  }, [storeName]);

  // Fetch locations when ZIP code changes
  useEffect(() => {
    fetchKrogerLocations(zipCode);
  }, [zipCode, fetchKrogerLocations]);

  const handleLocationClick = (location) => {
    onLocationSelect({
      locationId: location.locationId,
      name: location.name,
      address: location.address,
      chain: location.chain
    });
  };

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center py-6 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
        <p className="text-sm text-gray-500">Finding {storeName || 'Kroger'} stores near you...</p>
      </div>
    );
  }

  if (locations.length === 0 && !error) {
    return null;
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 text-sm">
        <Navigation className="w-4 h-4 text-blue-600" />
        <span className="text-gray-700 font-medium">
          Select your {storeName || 'Kroger'} store (optional)
        </span>
      </div>

      <p className="text-xs text-gray-500 mb-3">
        Selecting a specific store enables real-time pricing for your recipes.
      </p>

      {/* Error/info message */}
      {error && (
        <div className="flex items-start gap-2 mb-3 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Location list */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {locations.map((location) => {
          const isSelected = selectedLocationId === location.locationId;
          const address = location.address;
          const addressStr = address
            ? `${address.street}, ${address.city}, ${address.state} ${address.zip}`
            : '';

          return (
            <button
              key={location.locationId}
              onClick={() => handleLocationClick(location)}
              className={`w-full p-3 rounded-xl text-left transition-all border-2 relative
                ${isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}
                >
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                    {location.name}
                  </p>
                  {addressStr && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {addressStr}
                    </p>
                  )}
                  {location.distance && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {location.distance} miles away
                    </p>
                  )}
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Skip option */}
      <button
        onClick={() => onLocationSelect(null)}
        className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 py-2"
      >
        Skip - I'll select a store later
      </button>
    </div>
  );
}
