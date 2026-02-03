import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

const cuisineOptions = [
  'Italian', 'Mexican', 'Indian', 'Chinese', 'American', 'Mediterranean',
  'Japanese', 'Thai', 'French', 'Korean', 'Vietnamese', 'Greek',
  'Spanish', 'Middle Eastern', 'Brazilian'
];

const dietOptions = [
  'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Pescatarian', 'Gluten-Free',
  'Dairy-Free', 'Low-Carb', 'Halal', 'Kosher'
];

export default function RecipeFilters({ filters, onChange, onClear }) {
  const activeFiltersCount = 
    (filters.cuisines?.length || 0) + 
    (filters.diets?.length || 0) + 
    (filters.maxCost ? 1 : 0) + 
    (filters.maxTime ? 1 : 0);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Cuisine Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="rounded-full border-2 border-gray-200 hover:border-green-300 hover:bg-green-50"
          >
            <span className="mr-2">🍽️</span>
            Cuisine
            {filters.cuisines?.length > 0 && (
              <Badge className="ml-2 bg-green-500">{filters.cuisines.length}</Badge>
            )}
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4">
          <div className="grid grid-cols-2 gap-2">
            {cuisineOptions.map((cuisine) => (
              <button
                key={cuisine}
                onClick={() => {
                  const newCuisines = filters.cuisines?.includes(cuisine)
                    ? filters.cuisines.filter(c => c !== cuisine)
                    : [...(filters.cuisines || []), cuisine];
                  onChange({ ...filters, cuisines: newCuisines });
                }}
                className={`px-3 py-2 rounded-full text-sm transition-all
                  ${filters.cuisines?.includes(cuisine)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                  }`}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Diet Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="rounded-full border-2 border-gray-200 hover:border-green-300 hover:bg-green-50"
          >
            <span className="mr-2">🥗</span>
            Diet
            {filters.diets?.length > 0 && (
              <Badge className="ml-2 bg-green-500">{filters.diets.length}</Badge>
            )}
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4">
          <div className="grid grid-cols-2 gap-2">
            {dietOptions.map((diet) => (
              <button
                key={diet}
                onClick={() => {
                  const newDiets = filters.diets?.includes(diet)
                    ? filters.diets.filter(d => d !== diet)
                    : [...(filters.diets || []), diet];
                  onChange({ ...filters, diets: newDiets });
                }}
                className={`px-3 py-2 rounded-full text-sm transition-all
                  ${filters.diets?.includes(diet)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                  }`}
              >
                {diet}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Cost Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="rounded-full border-2 border-gray-200 hover:border-green-300 hover:bg-green-50"
          >
            <DollarSign className="w-4 h-4 mr-1" />
            Cost
            {filters.maxCost && (
              <Badge className="ml-2 bg-green-500">${filters.maxCost}</Badge>
            )}
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4">
          <div className="space-y-4">
            <p className="text-sm font-medium">Max cost per recipe</p>
            <Slider
              value={[filters.maxCost || 50]}
              onValueChange={([value]) => onChange({ ...filters, maxCost: value })}
              max={100}
              min={5}
              step={5}
              className="w-full"
            />
            <p className="text-center text-lg font-semibold text-green-600">
              ${filters.maxCost || 50}
            </p>
          </div>
        </PopoverContent>
      </Popover>

      {/* Time Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="rounded-full border-2 border-gray-200 hover:border-green-300 hover:bg-green-50"
          >
            <Clock className="w-4 h-4 mr-1" />
            Time
            {filters.maxTime && (
              <Badge className="ml-2 bg-green-500">{filters.maxTime}min</Badge>
            )}
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4">
          <div className="space-y-4">
            <p className="text-sm font-medium">Max cooking time</p>
            <Slider
              value={[filters.maxTime || 60]}
              onValueChange={([value]) => onChange({ ...filters, maxTime: value })}
              max={180}
              min={10}
              step={10}
              className="w-full"
            />
            <p className="text-center text-lg font-semibold text-green-600">
              {filters.maxTime || 60} minutes
            </p>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear Filters */}
      <AnimatePresence>
        {activeFiltersCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Button
              variant="ghost"
              onClick={onClear}
              className="text-gray-500 hover:text-red-500"
            >
              <X className="w-4 h-4 mr-1" />
              Clear all ({activeFiltersCount})
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}