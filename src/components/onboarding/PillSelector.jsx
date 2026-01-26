import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function PillSelector({ options, selected, onChange, columns = 3 }) {
  const toggleOption = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-${columns} gap-3`}>
      {options.map((option) => {
        const isSelected = selected.includes(option.value || option);
        const label = option.label || option;
        const value = option.value || option;
        const icon = option.icon;

        return (
          <motion.button
            key={value}
            type="button"
            onClick={() => toggleOption(value)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative px-4 py-3 rounded-full border-2 transition-all duration-200 text-sm font-medium
              flex items-center justify-center gap-2
              ${isSelected 
                ? 'border-green-400 bg-green-50 text-green-700 shadow-sm' 
                : 'border-gray-200 bg-white text-gray-600 hover:border-green-200 hover:bg-green-50/50'
              }`}
          >
            {icon && <span className="text-lg">{icon}</span>}
            <span>{label}</span>
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
    </div>
  );
}