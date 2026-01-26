import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  'Basic Info',
  'Location',
  'Cuisines',
  'Diets',
  'Household',
  'Pantry',
  'Notifications'
];

export default function OnboardingProgress({ currentStep }) {
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-2">
        {steps.map((step, index) => (
          <div key={step} className="flex flex-col items-center flex-1">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ 
                scale: currentStep === index + 1 ? 1.1 : 1,
                backgroundColor: currentStep >= index + 1 ? '#4ade80' : '#e5e7eb'
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                ${currentStep >= index + 1 ? 'bg-green-400 text-white' : 'bg-gray-200 text-gray-500'}
                ${currentStep === index + 1 ? 'ring-4 ring-green-100' : ''}`}
            >
              {index + 1}
            </motion.div>
            <span className={`text-[10px] mt-1 text-center hidden sm:block
              ${currentStep >= index + 1 ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
              {step}
            </span>
          </div>
        ))}
      </div>
      <div className="relative h-1 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="absolute h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  );
}