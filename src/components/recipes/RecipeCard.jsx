import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, DollarSign, Heart, Leaf, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function RecipeCard({ recipe, onSave, isSaved, onClick, householdSize = 4, pantryItems = [] }) {
  // Calculate cost with pantry deductions
  const { scaledCost, originalCost, hasPantryDeduction } = useMemo(() => {
    const scale = householdSize / (recipe.servings || 4);
    let original = (recipe.total_cost || 0) * scale;
    let adjusted = original;
    
    if (pantryItems?.length > 0 && recipe.ingredients) {
      recipe.ingredients.forEach(ing => {
        const inPantry = pantryItems.some(p => 
          ing.name.toLowerCase().includes(p.toLowerCase())
        );
        if (inPantry) {
          adjusted -= (ing.estimated_price || 0) * scale;
        }
      });
    }
    
    return {
      scaledCost: Math.max(adjusted, 0),
      originalCost: original,
      hasPantryDeduction: adjusted < original
    };
  }, [recipe, householdSize, pantryItems]);

  const costPerServing = scaledCost / householdSize;

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
      onClick={onClick}
      className="bg-white rounded-3xl overflow-hidden cursor-pointer group border border-gray-100"
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={recipe.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
          alt={recipe.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        
        {/* Save Button */}
        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onSave?.(recipe);
          }}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full backdrop-blur-sm transition-all
            ${isSaved ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white/80 text-gray-600 hover:bg-white'}`}
        >
          <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
        </Button>

        {/* Pantry Badge */}
        {hasPantryDeduction && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Package className="w-3 h-3" />
              Pantry savings!
            </Badge>
          </div>
        )}

        {/* Cuisine Tags */}
        <div className="absolute bottom-3 left-3 flex gap-2 flex-wrap">
          {recipe.cuisines?.slice(0, 2).map((cuisine) => (
            <Badge 
              key={cuisine} 
              className="bg-white/90 text-gray-700 text-xs font-medium px-2 py-1 rounded-full"
            >
              {cuisine}
            </Badge>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
          {recipe.title}
        </h3>

        {/* Diet Tags */}
        {recipe.diets?.length > 0 && (
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {recipe.diets.slice(0, 3).map((diet) => (
              <span
                key={diet}
                className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full"
              >
                <Leaf className="w-3 h-3" />
                {diet}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>{(recipe.prep_time || 0) + (recipe.cook_time || 0)} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-blue-500" />
            <span>{householdSize} servings</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-green-600" />
            <div className="flex flex-col items-end">
              <span className="font-semibold text-green-600">
                ${scaledCost.toFixed(2)}
              </span>
              {hasPantryDeduction && (
                <span className="text-[10px] text-gray-400 line-through">
                  ${originalCost.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}