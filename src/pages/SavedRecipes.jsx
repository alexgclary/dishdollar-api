import React, { useState } from 'react';
import { auth, entities } from '@/services';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, Search, Filter, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RecipeCard from '@/components/recipes/RecipeCard';
import RecipeFilters from '@/components/recipes/RecipeFilters';

export default function SavedRecipes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ cuisines: [], diets: [], maxCost: null, maxTime: null });

  // Fetch user profile
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const user = await auth.me();
      const profiles = await entities.UserProfile.filter({ user_id: user.id });
      return profiles[0];
    }
  });

  // Fetch saved recipes
  const { data: savedRecipes = [] } = useQuery({
    queryKey: ['savedRecipes'],
    queryFn: async () => {
      const user = await auth.me();
      return entities.SavedRecipe.filter({ user_id: user.id });
    }
  });

  // Fetch all recipes to get details
  const { data: allRecipes = [] } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => entities.Recipe.list('-created_date', 100)
  });

  // Remove recipe mutation
  const removeRecipeMutation = useMutation({
    mutationFn: async (savedRecipeId) => {
      return entities.SavedRecipe.delete(savedRecipeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedRecipes'] });
    }
  });

  // Get full recipe details for saved recipes
  const savedRecipeDetails = savedRecipes
    .map(sr => {
      const recipe = allRecipes.find(r => r.id === sr.recipe_id);
      return recipe ? { ...recipe, savedRecipeId: sr.id } : null;
    })
    .filter(Boolean);

  // Filter recipes
  const filteredRecipes = savedRecipeDetails.filter(recipe => {
    const matchesSearch = !searchQuery || 
      recipe.title?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCuisine = filters.cuisines.length === 0 ||
      recipe.cuisines?.some(c => filters.cuisines.includes(c));
    
    const matchesDiet = filters.diets.length === 0 ||
      recipe.diets?.some(d => filters.diets.includes(d));
    
    const matchesCost = !filters.maxCost || 
      (recipe.total_cost || 0) <= filters.maxCost;
    
    const matchesTime = !filters.maxTime || 
      ((recipe.prep_time || 0) + (recipe.cook_time || 0)) <= filters.maxTime;

    return matchesSearch && matchesCuisine && matchesDiet && matchesCost && matchesTime;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => navigate(createPageUrl('Home'))}
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/20 hover:bg-white/30 text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <Heart className="w-10 h-10 fill-current" />
                My Saved Recipes
              </h1>
              <p className="text-red-100 mt-2">
                {savedRecipeDetails.length} {savedRecipeDetails.length === 1 ? 'recipe' : 'recipes'} saved
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your recipes..."
              className="w-full pl-12 pr-4 py-6 text-lg rounded-full border-0 shadow-xl text-gray-800"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="mb-8">
          <RecipeFilters
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters({ cuisines: [], diets: [], maxCost: null, maxTime: null })}
          />
        </div>

        {/* Recipes Grid */}
        {filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredRecipes.map((recipe, index) => (
                <motion.div
                  key={recipe.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  <RecipeCard
                    recipe={recipe}
                    householdSize={userProfile?.household_size || 4}
                    isSaved={true}
                    onSave={() => removeRecipeMutation.mutate(recipe.savedRecipeId)}
                    onClick={() => navigate(createPageUrl('RecipeDetails') + `?id=${recipe.id}`)}
                  />
                  
                  {/* Remove Button */}
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Remove this recipe from your saved list?')) {
                        removeRecipeMutation.mutate(recipe.savedRecipeId);
                      }
                    }}
                    className="absolute bottom-4 right-4 w-10 h-10 rounded-full shadow-lg opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {searchQuery || filters.cuisines.length > 0 || filters.diets.length > 0
                ? 'No recipes match your filters'
                : 'No saved recipes yet'}
            </h2>
            <p className="text-gray-500 mb-6">
              {searchQuery || filters.cuisines.length > 0 || filters.diets.length > 0
                ? 'Try adjusting your search or filters'
                : 'Start saving your favorite recipes from the home page'}
            </p>
            {!searchQuery && filters.cuisines.length === 0 && filters.diets.length === 0 && (
              <Button
                onClick={() => navigate(createPageUrl('Home'))}
                className="rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                Discover Recipes
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}