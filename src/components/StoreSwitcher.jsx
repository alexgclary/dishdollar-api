import React, { useState, useEffect } from 'react';
import { Store, ChevronDown, Check, MapPin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

// Store options with icons
const stores = [
  { name: 'Walmart', icon: '🏪' },
  { name: 'Kroger', icon: '🛒' },
  { name: 'Whole Foods', icon: '🥬' },
  { name: "Trader Joe's", icon: '🌻' },
  { name: 'Costco', icon: '📦' },
  { name: 'Safeway', icon: '🛍️' },
  { name: 'Publix', icon: '🍊' },
  { name: 'Aldi', icon: '💰' },
  { name: 'Target', icon: '🎯' },
  { name: 'HEB', icon: '🤠' },
  { name: 'Wegmans', icon: '🥗' },
  { name: 'Sprouts', icon: '🌱' },
  { name: 'Food Lion', icon: '🦁' },
  { name: 'Albertsons', icon: '🏬' },
  { name: 'Meijer', icon: '🌟' },
  { name: 'WinCo', icon: '🏷️' },
  { name: 'Grocery Outlet', icon: '🎪' },
  { name: 'Other', icon: '🏠' }
];

export default function StoreSwitcher({ className = '', compact = false }) {
  const { toast } = useToast();
  const [currentStore, setCurrentStore] = useState('');

  // Load current store from localStorage on mount
  useEffect(() => {
    const profile = JSON.parse(localStorage.getItem('dishdollar_profile') || '{}');
    setCurrentStore(profile.preferred_store || '');
  }, []);

  const handleStoreChange = (newStore) => {
    setCurrentStore(newStore);

    // Update localStorage profile
    const profile = JSON.parse(localStorage.getItem('dishdollar_profile') || '{}');
    profile.preferred_store = newStore;
    localStorage.setItem('dishdollar_profile', JSON.stringify(profile));

    // Show confirmation
    const storeInfo = stores.find(s => s.name === newStore);
    toast({
      title: 'Store Updated',
      description: `${storeInfo?.icon || '🛒'} Now shopping at ${newStore}`,
    });
  };

  const currentStoreInfo = stores.find(s => s.name === currentStore);

  if (compact) {
    // Compact version for mobile/narrow spaces
    return (
      <Select value={currentStore} onValueChange={handleStoreChange}>
        <SelectTrigger className={`w-auto gap-1 border-none bg-transparent shadow-none hover:bg-gray-100 rounded-full px-3 py-2 ${className}`}>
          <Store className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium truncate max-w-[100px]">
            {currentStore || 'Select store'}
          </span>
        </SelectTrigger>
        <SelectContent>
          {stores.map((store) => (
            <SelectItem key={store.name} value={store.name}>
              <span className="flex items-center gap-2">
                <span>{store.icon}</span>
                <span>{store.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Full version with more details
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select value={currentStore} onValueChange={handleStoreChange}>
        <SelectTrigger className="w-[200px] rounded-xl border-2 border-gray-200 hover:border-green-400 focus:border-green-500">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-green-600" />
            <SelectValue placeholder="Select your store">
              {currentStore && (
                <span className="flex items-center gap-2">
                  <span>{currentStoreInfo?.icon}</span>
                  <span>{currentStore}</span>
                </span>
              )}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
            Choose your store
          </div>
          {stores.map((store) => (
            <SelectItem key={store.name} value={store.name} className="cursor-pointer">
              <span className="flex items-center gap-2">
                <span className="text-lg">{store.icon}</span>
                <span>{store.name}</span>
                {currentStore === store.name && (
                  <Check className="w-4 h-4 text-green-600 ml-auto" />
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
