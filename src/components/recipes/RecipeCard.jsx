import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, DollarSign, Heart, Leaf, Package, ShoppingCart, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { shoppingListStorage } from '@/utils/shoppingListStorage';
import { useToast } from '@/components/ui/use-toast';

export default function RecipeCard({ recipe, onSave, isSaved, onClick, householdSize = 4, pantryItems = [] }) {
  const { toast } = useToast();
  const [isInList, setIsInList] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Check if recipe is in shopping list
  useEffect(() => {
    if (recipe?.title) {
      setIsInList(shoppingListStorage.hasRecipeItems(recipe.title));
    }
  }, [recipe]);

  const addToShoppingList = (e) => {
    e.stopPropagation();
    if (!recipe?.ingredients) {
      toast({ title: "No ingredients", description: "This recipe has no ingredients to add" });
      return;
    }

    const scale = householdSize / (recipe.servings || 4);
    const ingredients = recipe.ingredients
      .filter(ing => !pantryItems?.some(p => ing.name.toLowerCase().includes(p.toLowerCase())))
      .map(ing => ({
        name: ing.name,
        quantity: (ing.amount || 1) * scale,
        unit: ing.unit || ''
      }));

    const count = shoppingListStorage.addRecipeItems(recipe, ingredients);
    setIsInList(true);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
    toast({
      title: "Added to shopping list!",
      description: `${count} item${count !== 1 ? 's' : ''} from ${recipe.title}`
    });
  };

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
        
        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex gap-2">
          {/* Add to Shopping List Button */}
          <Button
            size="icon"
            variant="ghost"
            onClick={addToShoppingList}
            className={`w-10 h-10 rounded-full backdrop-blur-sm transition-all
              ${justAdded ? 'bg-green-500 text-white' : isInList ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-white/80 text-gray-600 hover:bg-white'}`}
            title={isInList ? 'In shopping list' : 'Add to shopping list'}
          >
            {justAdded ? <Check className="w-5 h-5" /> : <ShoppingCart className={`w-5 h-5 ${isInList ? 'fill-green-100' : ''}`} />}
          </Button>

          {/* Save Button */}
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onSave?.(recipe);
            }}
            className={`w-10 h-10 rounded-full backdrop-blur-sm transition-all
              ${isSaved ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white/80 text-gray-600 hover:bg-white'}`}
          >
            <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </Button>
        </div>

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