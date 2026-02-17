import React, { useState } from 'react';
import { auth, entities } from '@/services';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, addDays, isSameDay } from 'date-fns';
import { Calendar, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function MealPlanModal({ open, onOpenChange, recipe, servings, userProfile }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState(null);

  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  const { data: mealPlans = [] } = useQuery({
    queryKey: ['mealPlans'],
    queryFn: async () => {
      const user = await auth.me();
      return entities.MealPlan.filter({ user_id: user.id });
    },
    enabled: open
  });

  const addMealMutation = useMutation({
    mutationFn: async () => {
      const user = await auth.me();
      const householdSize = userProfile?.household_size || 1;
      const scaledCost = ((recipe.total_cost || 0) / (recipe.servings || 4)) * householdSize;
      return entities.MealPlan.create({
        user_id: user.id,
        date: format(selectedDay, 'yyyy-MM-dd'),
        meal_type: selectedMealType,
        recipe_id: recipe.id,
        recipe_title: recipe.title,
        recipe_image: recipe.image_url,
        estimated_cost: scaledCost,
        servings: servings || householdSize
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast({
        title: "Added to meal plan!",
        description: `${recipe.title} → ${selectedMealType}, ${format(selectedDay, 'EEE, MMM d')}`
      });
      setSelectedDay(null);
      setSelectedMealType(null);
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Failed to add meal",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  });

  const getExistingMeal = (date, mealType) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return mealPlans.find(m => m.date === dateStr && m.meal_type === mealType);
  };

  const handleConfirm = () => {
    if (!selectedDay || !selectedMealType) return;
    addMealMutation.mutate();
  };

  const isToday = (date) => isSameDay(date, new Date());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            Add to Meal Plan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Recipe preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <img
              src={recipe?.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'}
              alt=""
              className="w-14 h-14 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate">{recipe?.title}</p>
              <p className="text-sm text-gray-500">
                <Clock className="w-3 h-3 inline mr-1" />
                {(recipe?.prep_time || 0) + (recipe?.cook_time || 0)} min · {servings} servings
              </p>
            </div>
          </div>

          {/* Day selector */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Select a day</p>
            <div className="grid grid-cols-7 gap-1.5">
              {next7Days.map(day => (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={`flex flex-col items-center p-2 rounded-xl transition-all text-center
                    ${selectedDay && isSameDay(day, selectedDay)
                      ? 'bg-green-500 text-white shadow-md'
                      : isToday(day)
                        ? 'bg-green-50 border-2 border-green-300 text-green-800'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                >
                  <span className="text-[10px] uppercase font-medium">{format(day, 'EEE')}</span>
                  <span className="text-lg font-bold">{format(day, 'd')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Meal type selector */}
          {selectedDay && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Select a meal — {format(selectedDay, 'EEEE, MMM d')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {MEAL_TYPES.map(type => {
                  const existing = getExistingMeal(selectedDay, type);
                  const isSelected = selectedMealType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedMealType(type)}
                      className={`p-3 rounded-xl border-2 text-left transition-all
                        ${isSelected
                          ? 'border-green-500 bg-green-50'
                          : existing
                            ? 'border-amber-200 bg-amber-50'
                            : 'border-gray-100 hover:border-green-300 bg-white'
                        }`}
                    >
                      <p className={`font-medium ${isSelected ? 'text-green-700' : 'text-gray-800'}`}>{type}</p>
                      {existing ? (
                        <p className="text-xs text-amber-600 truncate mt-0.5">{existing.recipe_title}</p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-0.5">Empty</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Confirm button */}
          <Button
            onClick={handleConfirm}
            disabled={!selectedDay || !selectedMealType || addMealMutation.isPending}
            className="w-full rounded-full bg-green-500 hover:bg-green-600 disabled:opacity-50"
          >
            {addMealMutation.isPending ? (
              'Adding...'
            ) : selectedDay && selectedMealType ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Add to {selectedMealType} — {format(selectedDay, 'EEE, MMM d')}
              </>
            ) : (
              'Select a day and meal'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
