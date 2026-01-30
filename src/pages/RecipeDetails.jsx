import React, { useState, useEffect } from 'react';
import { auth, entities } from '@/services';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Users, DollarSign, Heart, Plus, Minus, ShoppingCart, ChefHat, Leaf, Calendar, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function RecipeDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [servings, setServings] = useState(4);
  const [recipe, setRecipe] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showShoppingDialog, setShowShoppingDialog] = useState(false);
  const [copiedList, setCopiedList] = useState(false);
  const [manualPantryItems, setManualPantryItems] = useState([]);

  const urlParams = new URLSearchParams(window.location.search);
  const recipeId = urlParams.get('id');

  const { data: recipeData, isLoading } = useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: async () => {
      const recipes = await entities.Recipe.filter({ id: recipeId });
      return recipes[0];
    },
    enabled: !!recipeId
  });

  const { data: profileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const user = await auth.me();
      const profiles = await entities.UserProfile.filter({ user_id: user.id });
      return profiles[0];
    }
  });

  const { data: savedRecipes = [] } = useQuery({
    queryKey: ['savedRecipes'],
    queryFn: async () => {
      const user = await auth.me();
      return entities.SavedRecipe.filter({ user_id: user.id });
    }
  });

  const saveRecipeMutation = useMutation({
    mutationFn: async () => {
      const user = await auth.me();
      const existing = savedRecipes.find(sr => sr.recipe_id === recipe.id);
      if (existing) {
        return entities.SavedRecipe.delete(existing.id);
      } else {
        return entities.SavedRecipe.create({
          user_id: user.id,
          recipe_id: recipe.id,
          saved_at: new Date().toISOString(),
          custom_servings: servings
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedRecipes'] });
    }
  });

  const addToBudgetMutation = useMutation({
    mutationFn: async () => {
      const user = await auth.me();
      const scaledCost = calculateTotalCost();
      return entities.BudgetEntry.create({
        user_id: user.id,
        recipe_id: recipe.id,
        recipe_title: recipe.title,
        amount: scaledCost,
        date: new Date().toISOString().split('T')[0],
        servings: servings
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetEntries'] });
      toast({ title: "Added to budget!", description: `$${calculateTotalCost().toFixed(2)} added to your spending tracker` });
    }
  });

  useEffect(() => {
    if (recipeData) {
      setRecipe(recipeData);
      setServings(recipeData.servings || 4);
    }
  }, [recipeData]);

  useEffect(() => {
    if (profileData) {
      setUserProfile(profileData);
      if (profileData.household_size) setServings(profileData.household_size);
    }
  }, [profileData]);

  const isIngredientInPantry = (ing, index) => {
    // Check if manually toggled to pantry
    if (manualPantryItems.includes(index)) return true;
    // Check if in user's saved pantry
    return userProfile?.pantry_items?.some(p => ing.name.toLowerCase().includes(p.toLowerCase()));
  };

  const togglePantryItem = (index) => {
    setManualPantryItems(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const calculateTotalCost = () => {
    if (!recipe) return 0;
    const scale = servings / recipe.servings;
    let total = 0;
    recipe.ingredients?.forEach((ing, index) => {
      if (!isIngredientInPantry(ing, index)) {
        total += (ing.estimated_price || 0) * scale;
      }
    });
    return Math.max(total, 0);
  };

  const getShoppingItems = () => {
    if (!recipe?.ingredients) return [];
    const scale = servings / recipe.servings;
    return recipe.ingredients
      .map((ing, index) => ({ ...ing, originalIndex: index }))
      .filter((ing) => !isIngredientInPantry(ing, ing.originalIndex))
      .map(ing => ({
        ...ing,
        scaledAmount: (ing.amount * scale).toFixed(1),
        scaledPrice: (ing.estimated_price || 0) * scale
      }));
  };

  const copyShoppingList = () => {
    const items = getShoppingItems();
    const text = `Shopping List: ${recipe.title} (${servings} servings)\n\n${items.map(i => `□ ${i.scaledAmount} ${i.unit} ${i.name}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopiedList(true);
    setTimeout(() => setCopiedList(false), 2000);
    toast({ title: "Copied!", description: "Shopping list copied to clipboard" });
  };

  const isSaved = savedRecipes.some(sr => sr.recipe_id === recipe?.id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50 flex items-center justify-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
          <ChefHat className="w-8 h-8 text-green-600" />
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Recipe not found</h2>
          <Button onClick={() => navigate(createPageUrl('Home'))} className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const totalCost = calculateTotalCost();
  const shoppingItems = getShoppingItems();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50">
      <div className="relative h-96 overflow-hidden">
        <img src={recipe.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'} alt={recipe.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        <Button onClick={() => navigate(-1)} variant="ghost" size="icon" className="absolute top-6 left-6 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white">
          <ArrowLeft className="w-6 h-6 text-gray-800" />
        </Button>

        <Button onClick={() => saveRecipeMutation.mutate()} size="icon" className={`absolute top-6 right-6 w-12 h-12 rounded-full backdrop-blur-sm ${isSaved ? 'bg-red-500 hover:bg-red-600' : 'bg-white/90 hover:bg-white'}`}>
          <Heart className={`w-6 h-6 ${isSaved ? 'text-white fill-current' : 'text-gray-800'}`} />
        </Button>

        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h1 className="text-4xl font-bold mb-4">{recipe.title}</h1>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">
              <Clock className="w-5 h-5" /><span>{(recipe.prep_time || 0) + (recipe.cook_time || 0)} min</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">
              <Users className="w-5 h-5" /><span>{servings} servings</span>
            </div>
            <div className="flex items-center gap-2 bg-green-500 px-4 py-2 rounded-full font-semibold">
              <DollarSign className="w-5 h-5" /><span>${totalCost.toFixed(2)} total</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex flex-wrap gap-2">
              {recipe.cuisines?.map(c => <Badge key={c} className="bg-amber-100 text-amber-800 text-sm px-3 py-1">{c}</Badge>)}
              {recipe.diets?.map(d => <Badge key={d} className="bg-green-100 text-green-800 text-sm px-3 py-1"><Leaf className="w-3 h-3 mr-1" />{d}</Badge>)}
            </div>

            {recipe.description && (
              <Card>
                <CardHeader><CardTitle>About this recipe</CardTitle></CardHeader>
                <CardContent><p className="text-gray-600 leading-relaxed">{recipe.description}</p></CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Ingredients</CardTitle>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" onClick={() => setServings(Math.max(1, servings - 1))} className="rounded-full w-8 h-8"><Minus className="w-4 h-4" /></Button>
                  <span className="text-lg font-semibold w-12 text-center">{servings}</span>
                  <Button size="icon" variant="outline" onClick={() => setServings(servings + 1)} className="rounded-full w-8 h-8"><Plus className="w-4 h-4" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 mb-3">Tap an ingredient to toggle "In Pantry" status</p>
                <div className="space-y-3">
                  {recipe.ingredients?.map((ing, index) => {
                    const scale = servings / recipe.servings;
                    const isInPantry = isIngredientInPantry(ing, index);
                    return (
                      <motion.div 
                        key={index} 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ delay: index * 0.05 }}
                        onClick={() => togglePantryItem(index)}
                        className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${isInPantry ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100 hover:border-green-300 hover:bg-green-50/50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isInPantry ? 'bg-green-500' : 'bg-gray-200'}`}>
                            {isInPantry && <Check className="w-4 h-4 text-white" />}
                          </div>
                          <span className={isInPantry ? 'text-green-800 font-medium' : 'text-gray-800'}>{(ing.amount * scale).toFixed(1)} {ing.unit} {ing.name}</span>
                        </div>
                        <span className={`text-sm font-semibold ${isInPantry ? 'text-green-600' : 'text-gray-600'}`}>
                          {isInPantry ? 'In pantry' : `$${((ing.estimated_price || 0) * scale).toFixed(2)}`}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Instructions</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recipe.instructions?.map((instruction, index) => (
                    <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">{index + 1}</div>
                      <p className="text-gray-700 leading-relaxed pt-1">{instruction}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-600" />Cost Breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Total cost</span><span className="font-semibold text-gray-800">${totalCost.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Per serving</span><span className="font-semibold text-gray-800">${(totalCost / servings).toFixed(2)}</span></div>
                  {userProfile?.pantry_items?.length > 0 && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-green-600 flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span>Pantry items deducted</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-4">
                  <Button onClick={() => addToBudgetMutation.mutate()} disabled={addToBudgetMutation.isPending} className="w-full rounded-full bg-green-500 hover:bg-green-600">
                    <Plus className="w-4 h-4 mr-2" />{addToBudgetMutation.isPending ? 'Adding...' : 'Add to Budget'}
                  </Button>

                  <Button variant="outline" onClick={() => setShowShoppingDialog(true)} className="w-full rounded-full border-2 border-green-500 text-green-600 hover:bg-green-50">
                    <ShoppingCart className="w-4 h-4 mr-2" />Shopping List
                  </Button>

                  <Button variant="outline" onClick={() => navigate(createPageUrl('MealPlanner'))} className="w-full rounded-full">
                    <Calendar className="w-4 h-4 mr-2" />Add to Meal Plan
                  </Button>

                  <Button
                    onClick={() => window.open('https://docs.instacart.com/developer_platform_api/', '_blank')}
                    className="w-full rounded-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Shop with Instacart
                  </Button>
                </div>

                {recipe.source_url && (
                  <div className="pt-4 border-t border-gray-100">
                    <a href={recipe.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">View original recipe →</a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showShoppingDialog} onOpenChange={setShowShoppingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShoppingCart className="w-5 h-5" />Shopping List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{shoppingItems.length} items needed (pantry items excluded)</p>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {shoppingItems.map((item, i) => (
                <div key={i} className="flex justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-800">{item.scaledAmount} {item.unit} {item.name}</span>
                  <span className="text-green-600 font-medium">${item.scaledPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>Total</span>
              <span className="text-green-600">${shoppingItems.reduce((s, i) => s + i.scaledPrice, 0).toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={copyShoppingList} variant="outline" className="flex-1 rounded-full">
                {copiedList ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copiedList ? 'Copied!' : 'Copy List'}
              </Button>
              <Button onClick={() => { setShowShoppingDialog(false); navigate(createPageUrl('ShoppingList')); }} className="flex-1 rounded-full bg-green-500 hover:bg-green-600">
                Full Shopping List
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}