import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Search, X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function SearchablePillSelector({
  options,
  searchableOptions = [],
  selected,
  onChange,
  columns = 3,
  placeholder = "Search more...",
  searchLabel = "More"
}) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOptions, setFilteredOptions] = useState([]);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Combine all options for searching
  const allOptions = [...options, ...searchableOptions.filter(
    so => !options.some(o => (o.value || o) === (so.value || so))
  )];

  // Filter options based on search query
  useEffect(() => {
    if (searchQuery.length >= 1) {
      const query = searchQuery.toLowerCase();
      const matches = allOptions.filter(opt => {
        const value = (opt.value || opt).toLowerCase();
        const label = (opt.label || opt.value || opt).toLowerCase();
        return (value.includes(query) || label.includes(query)) &&
               !selected.includes(opt.value || opt);
      });
      setFilteredOptions(matches.slice(0, 8));
    } else {
      setFilteredOptions([]);
    }
  }, [searchQuery, allOptions, selected]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (showSearch && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showSearch]);

  const toggleOption = (option) => {
    const value = option.value || option;
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectFromSearch = (option) => {
    const value = option.value || option;
    if (!selected.includes(value)) {
      onChange([...selected, value]);
    }
    setSearchQuery('');
    setShowSearch(false);
  };

  // Get display info for selected items (including ones from searchableOptions)
  const getOptionDisplay = (value) => {
    const fromOptions = options.find(o => (o.value || o) === value);
    if (fromOptions) return fromOptions;
    const fromSearchable = searchableOptions.find(o => (o.value || o) === value);
    if (fromSearchable) return fromSearchable;
    return { value, label: value };
  };

  // Items to display as pills (predefined options + selected searchable items)
  const displayItems = [
    ...options,
    ...selected
      .filter(s => !options.some(o => (o.value || o) === s))
      .map(s => getOptionDisplay(s))
  ];

  return (
    <div className="space-y-3">
      <div className={`grid grid-cols-2 sm:grid-cols-${columns} gap-2`}>
        {displayItems.map((option) => {
          const value = option.value || option;
          const label = option.label || option;
          const icon = option.icon;
          const isSelected = selected.includes(value);

          return (
            <motion.button
              key={value}
              type="button"
              onClick={() => toggleOption(option)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative px-3 py-2 min-h-[40px] rounded-full border-2 transition-all duration-200 text-sm font-medium
                flex items-center justify-center gap-1.5
                ${isSelected
                  ? 'border-green-400 bg-green-50 text-green-700 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-green-200 hover:bg-green-50/50'
                }`}
            >
              {icon && <span className="text-base flex-shrink-0">{icon}</span>}
              <span className="truncate text-xs sm:text-sm">{label}</span>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </motion.button>
          );
        })}

        {/* Search/More button */}
        <div className="relative" ref={searchRef}>
          <motion.button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full px-3 py-2 min-h-[40px] rounded-full border-2 transition-all duration-200 text-sm font-medium
              flex items-center justify-center gap-1.5
              ${showSearch
                ? 'border-blue-400 bg-blue-50 text-blue-700'
                : 'border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="text-xs sm:text-sm">{searchLabel}</span>
          </motion.button>

          {/* Search dropdown */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
                style={{ minWidth: '280px' }}
              >
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      ref={inputRef}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={placeholder}
                      className="pl-9 pr-8 rounded-full border-gray-200"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => {
                      const value = option.value || option;
                      const label = option.label || option;
                      const icon = option.icon;

                      return (
                        <button
                          key={value}
                          onClick={() => selectFromSearch(option)}
                          className="w-full px-4 py-3 text-left hover:bg-green-50 flex items-center gap-2 text-sm transition-colors"
                        >
                          {icon && <span>{icon}</span>}
                          <span className="flex-1">{label}</span>
                          <Plus className="w-4 h-4 text-green-500" />
                        </button>
                      );
                    })
                  ) : searchQuery.length >= 1 ? (
                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                      No matches found
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                      Type to search...
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
