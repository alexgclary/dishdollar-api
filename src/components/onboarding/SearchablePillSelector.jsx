import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Search, X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import debounce from 'lodash/debounce';
import { fuzzySearchOptions, highlightMatch } from '@/utils/fuzzySearch';

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
  const [filteredResults, setFilteredResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Combine all options for searching (deduped)
  const allOptions = useMemo(() => {
    const seen = new Set();
    const combined = [];
    for (const opt of [...options, ...searchableOptions]) {
      const val = opt.value || opt;
      if (!seen.has(val)) {
        seen.add(val);
        combined.push(opt);
      }
    }
    return combined;
  }, [options, searchableOptions]);

  // Debounced fuzzy search
  const performSearch = useCallback(
    debounce((query) => {
      if (query.length >= 1) {
        const results = fuzzySearchOptions(query, allOptions, selected, 10);
        setFilteredResults(results);
        setActiveIndex(-1);
      } else {
        setFilteredResults([]);
        setActiveIndex(-1);
      }
    }, 150),
    [allOptions, selected]
  );

  // Trigger search on query change
  useEffect(() => {
    performSearch(searchQuery);
    return () => performSearch.cancel();
  }, [searchQuery, performSearch]);

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

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-search-item]');
      if (items[activeIndex]) {
        items[activeIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSearch) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev =>
          prev < filteredResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev =>
          prev > 0 ? prev - 1 : filteredResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredResults.length) {
          selectFromSearch(filteredResults[activeIndex].option);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSearch(false);
        setSearchQuery('');
        break;
    }
  };

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
    inputRef.current?.focus();
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

  // Render highlighted text segments
  const HighlightedText = ({ text, query }) => {
    const segments = highlightMatch(text, query);
    return (
      <span>
        {segments.map((seg, i) =>
          seg.highlighted ? (
            <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">{seg.text}</mark>
          ) : (
            <span key={i}>{seg.text}</span>
          )
        )}
      </span>
    );
  };

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
                      onKeyDown={handleKeyDown}
                      placeholder={placeholder}
                      className="pl-9 pr-8 rounded-full border-gray-200"
                      role="combobox"
                      aria-expanded={filteredResults.length > 0}
                      aria-activedescendant={activeIndex >= 0 ? `search-item-${activeIndex}` : undefined}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => { setSearchQuery(''); inputRef.current?.focus(); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto" ref={listRef} role="listbox">
                  {filteredResults.length > 0 ? (
                    filteredResults.map((result, index) => {
                      const { option, matchedVia } = result;
                      const value = option.value || option;
                      const label = option.label || option;
                      const icon = option.icon;
                      const isActive = index === activeIndex;

                      return (
                        <button
                          key={value}
                          id={`search-item-${index}`}
                          data-search-item
                          role="option"
                          aria-selected={isActive}
                          onClick={() => selectFromSearch(option)}
                          onMouseEnter={() => setActiveIndex(index)}
                          className={`w-full px-4 py-3 text-left flex items-center gap-2 text-sm transition-colors
                            ${isActive ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                        >
                          {icon && <span>{icon}</span>}
                          <span className="flex-1">
                            <HighlightedText text={label} query={searchQuery} />
                            {matchedVia && (
                              <span className="text-xs text-gray-400 ml-1.5">
                                ({matchedVia})
                              </span>
                            )}
                          </span>
                          <Plus className={`w-4 h-4 ${isActive ? 'text-green-600' : 'text-green-500'}`} />
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
