import React, { useState } from 'react';
import { auth, entities } from '@/services';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X, ShoppingCart, Calendar, DollarSign, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function MealPlanner() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showRecipeDialog, setShowRecipeDialog] = useState(false);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const user = await auth.me();
      const profiles = await entities.UserProfile.filter({ user_id: user.id });
      return profiles[0];
    }
  });

  const { data: mealPlans = [] } = useQuery({
    queryKey: ['mealPlans', currentWeekStart.toISOString()],
    queryFn: async () => {
      const user = await auth.me();
      return entities.MealPlan.filter({ user_id: user.id });
    }
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => entities.Recipe.list('-created_date', 50)
  });

  const { data: savedRecipes = [] } = useQuery({
    queryKey: ['savedRecipes'],
    queryFn: async () => {
      const user = await auth.me();
      return entities.SavedRecipe.filter({ user_id: user.id });
    }
  });

  const savedRecipeDetails = recipes.filter(r => savedRecipes.some(sr => sr.recipe_id === r.id));

  const addMealMutation = useMutation({
    mutationFn: async ({ date, mealType, recipe }) => {
      const user = await auth.me();
      const householdSize = userProfile?.household_size || 1;
      const scaledCost = ((recipe.total_cost || 0) / (recipe.servings || 4)) * householdSize;
      return entities.MealPlan.create({
        user_id: user.id,
        date: format(date, 'yyyy-MM-dd'),
        meal_type: mealType,
        recipe_id: recipe.id,
        recipe_title: recipe.title,
        recipe_image: recipe.image_url,
        estimated_cost: scaledCost,
        servings: householdSize
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      setShowRecipeDialog(false);
      toast({ title: "Meal added!" });
    }
  });

  const removeMealMutation = useMutation({
    mutationFn: (mealId) => entities.MealPlan.delete(mealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast({ title: "Meal removed" });
    }
  });

  const getMealsForSlot = (date, mealType) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return mealPlans.filter(m => m.date === dateStr && m.meal_type === mealType);
  };

  const weeklyStats = {
    totalCost: mealPlans.filter(m => weekDays.some(d => format(d, 'yyyy-MM-dd') === m.date)).reduce((sum, m) => sum + (m.estimated_cost || 0), 0),
    mealsPlanned: mealPlans.filter(m => weekDays.some(d => format(d, 'yyyy-MM-dd') === m.date)).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-green-600" />
              Meal Planner
            </h1>
            <p className="text-gray-500">Plan your week, save money</p>
          </div>
          <Button onClick={() => navigate(createPageUrl('ShoppingList'))} className="rounded-full bg-green-500 hover:bg-green-600">
            <ShoppingCart className="w-4 h-4 mr-2" />Generate Shopping List
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <DollarSign className="w-8 h-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">${weeklyStats.totalCost.toFixed(2)}</p>
              <p className="text-green-100">Weekly total</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <CardContent className="p-6">
              <Utensils className="w-8 h-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{weeklyStats.mealsPlanned}</p>
              <p className="text-blue-100">Meals planned</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <DollarSign className="w-8 h-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">${weeklyStats.mealsPlanned > 0 ? (weeklyStats.totalCost / weeklyStats.mealsPlanned).toFixed(2) : '0.00'}</p>
              <p className="text-amber-100">Avg per meal</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <Button variant="ghost" onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}><ChevronLeft /></Button>
            <CardTitle>{format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}</CardTitle>
            <Button variant="ghost" onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}><ChevronRight /></Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="grid grid-cols-8 gap-2 min-w-[800px]">
              <div></div>
              {weekDays.map(day => (
                <div key={day.toISOString()} className={`text-center p-2 rounded-lg ${isSameDay(day, new Date()) ? 'bg-green-100 text-green-800 font-bold' : ''}`}>
                  <p className="text-xs text-gray-500">{format(day, 'EEE')}</p>
                  <p className="text-lg font-semibold">{format(day, 'd')}</p>
                </div>
              ))}
              {MEAL_TYPES.map(mealType => (
                <React.Fragment key={mealType}>
                  <div className="flex items-center justify-end pr-2 text-sm font-medium text-gray-600">{mealType}</div>
                  {weekDays.map(day => {
                    const meals = getMealsForSlot(day, mealType);
                    return (
                      <div key={`${day.toISOString()}-${mealType}`} className="min-h-[80px] bg-gray-50 rounded-lg p-1 relative group">
                        <AnimatePresence>
                          {meals.map(meal => (
                            <motion.div key={meal.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                              className="bg-white rounded-lg p-1 shadow-sm mb-1 relative">
                              <img src={meal.recipe_image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'} alt="" className="w-full h-12 object-cover rounded" />
                              <p className="text-xs truncate mt-1">{meal.recipe_title}</p>
                              <button onClick={() => removeMealMutation.mutate(meal.id)}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs">
                                <X className="w-3 h-3" />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        <button onClick={() => { setSelectedSlot({ date: day, mealType }); setShowRecipeDialog(true); }}
                          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-green-500/20 rounded-lg transition-opacity">
                          <Plus className="w-6 h-6 text-green-600" />
                        </button>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showRecipeDialog} onOpenChange={setShowRecipeDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add {selectedSlot?.mealType} for {selectedSlot && format(selectedSlot.date, 'EEE, MMM d')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {savedRecipeDetails.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No saved recipes yet. Save some recipes first!</p>
                <Button onClick={() => navigate(createPageUrl('Home'))} className="rounded-full">Browse Recipes</Button>
              </div>
            ) : (
              savedRecipeDetails.map(recipe => (
                <button key={recipe.id} onClick={() => addMealMutation.mutate({ date: selectedSlot.date, mealType: selectedSlot.mealType, recipe })}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-green-50 border border-gray-100 text-left transition-colors">
                  <img src={recipe.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'} alt="" className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{recipe.title}</p>
                    <p className="text-sm text-green-600">${(recipe.total_cost || 0).toFixed(2)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}