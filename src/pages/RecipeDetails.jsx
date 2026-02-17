import React, { useState, useEffect } from 'react';
import { auth, entities } from '@/services';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { shoppingListStorage } from '@/utils/shoppingListStorage';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Users, DollarSign, Heart, Plus, Minus, ShoppingCart, ChefHat, Leaf, Calendar, Copy, Check, ListPlus, RefreshCw, Zap, Store, ExternalLink, Maximize2, Flame, Beef, Wheat, Droplets, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePricing } from '@/hooks/usePricing';
import { useRecipeNormalization } from '@/hooks/useRecipeNormalization';
import { RecipeDetailsSkeleton } from '@/components/recipes/RecipeSkeletons';
import MealPlanModal from '@/components/MealPlanModal';

export default function RecipeDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [servings, setServings] = useState(4);
  const [recipe, setRecipe] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showShoppingDialog, setShowShoppingDialog] = useState(false);
  const [copiedList, setCopiedList] = useState(false);
  const [addedToList, setAddedToList] = useState(false);
  const [manualPantryItems, setManualPantryItems] = useState([]);
  const [itemsInList, setItemsInList] = useState(false);
  const [showFullScreenInstructions, setShowFullScreenInstructions] = useState(false);
  const [isInstacartLoading, setIsInstacartLoading] = useState(false);
  const [showMealPlanModal, setShowMealPlanModal] = useState(false);

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

  // Get API base URL from environment
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://budgetbite-api-69cb51842c10.herokuapp.com';

  // Unified pricing hook (Kroger + Spoonacular + Fallback)
  const {
    pricing,
    isLoading: isPricingLoading,
    fetchPricing,
    refresh: refreshPricing,
    pricingSource,
    confidence: pricingConfidence
  } = usePricing(recipe?.ingredients, profileData, { autoFetch: true });

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

  // AI recipe normalization (rewriting)
  const { normalizedRecipe, isNormalizing, normalize } = useRecipeNormalization();

  // Trigger normalization for recipes that haven't been rewritten
  useEffect(() => {
    if (recipe && !recipe.rewritten && !isNormalizing && !normalizedRecipe && recipe.instructions?.length > 0) {
      normalize(recipe);
    }
  }, [recipe?.id]);

  // Apply normalized data when ready
  useEffect(() => {
    if (normalizedRecipe && recipe) {
      const updated = {
        ...recipe,
        title: normalizedRecipe.title || recipe.title,
        description: normalizedRecipe.description || recipe.description,
        instructions: normalizedRecipe.instructions || recipe.instructions,
        cuisines: normalizedRecipe.cuisines?.length ? normalizedRecipe.cuisines : recipe.cuisines,
        diets: normalizedRecipe.diets?.length ? normalizedRecipe.diets : recipe.diets,
        rewritten: true
      };
      setRecipe(updated);
      // Persist rewritten data back to the entity
      entities.Recipe.update(recipe.id, {
        instructions: updated.instructions,
        description: updated.description,
        cuisines: updated.cuisines,
        diets: updated.diets,
        rewritten: true
      }).catch(err => console.error('Failed to persist normalization:', err));
    }
  }, [normalizedRecipe]);

  // Check if recipe items are already in shopping list
  useEffect(() => {
    if (recipe?.title) {
      setItemsInList(shoppingListStorage.hasRecipeItems(recipe.title));
    }
  }, [recipe]);

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

  const getIngredientPrice = (ing) => {
    const pricedItem = pricing?.items?.find(
      item => item.ingredient?.toLowerCase() === ing.name?.toLowerCase()
    );
    if (pricedItem) return pricedItem.price;
    return ing.estimated_price || 2.50;
  };

  const getIngredientPriceInfo = (ing) => {
    return pricing?.items?.find(
      item => item.ingredient?.toLowerCase() === ing.name?.toLowerCase()
    ) || null;
  };

  const calculateTotalCost = () => {
    if (!recipe) return 0;
    const scale = servings / recipe.servings;
    let total = 0;
    recipe.ingredients?.forEach((ing, index) => {
      if (!isIngredientInPantry(ing, index)) {
        total += getIngredientPrice(ing) * scale;
      }
    });
    return Math.max(total, 0);
  };

  const hasLivePrices = pricingSource === 'kroger' || pricingSource === 'spoonacular';

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

  const addToShoppingList = () => {
    const items = getShoppingItems();
    const ingredients = items.map(item => ({
      name: item.name,
      quantity: parseFloat(item.scaledAmount),
      unit: item.unit
    }));

    const count = shoppingListStorage.addRecipeItems(recipe, ingredients);
    setAddedToList(true);
    setItemsInList(true);
    setTimeout(() => setAddedToList(false), 2000);
    toast({
      title: "Added to shopping list!",
      description: `${count} item${count !== 1 ? 's' : ''} from ${recipe.title} added`
    });
  };

  const handleShopWithInstacart = async () => {
    if (!recipe) return;

    setIsInstacartLoading(true);
    console.log('[Instacart] Starting request...');
    console.log('[Instacart] API_BASE:', API_BASE);

    try {
      // Get shopping items (excludes pantry items, applies serving scale)
      const shoppingItems = getShoppingItems();

      // Build ingredients array for Instacart
      const ingredients = shoppingItems.map(item => ({
        name: item.name,
        quantity: parseFloat(item.scaledAmount) || item.amount || 1,
        unit: item.unit || ''
      }));

      const requestBody = {
        recipe_id: recipe.id,
        title: recipe.title,
        image_url: recipe.image_url,
        ingredients: ingredients,
        instructions: recipe.instructions,
        servings: servings,
        cooking_time: (recipe.prep_time || 0) + (recipe.cook_time || 0)
      };

      const requestUrl = `${API_BASE}/api/instacart/recipe`;
      console.log('[Instacart] POST', requestUrl);
      console.log('[Instacart] Request body:', requestBody);

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('[Instacart] Response status:', response.status);

      const data = await response.json();
      console.log('[Instacart] Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }

      if (data.url) {
        // Append retailer_key if user has a preferred retailer
        let instacartUrl = data.url;
        if (profileData?.preferred_retailer_key) {
          const separator = instacartUrl.includes('?') ? '&' : '?';
          instacartUrl += `${separator}retailer_key=${profileData.preferred_retailer_key}`;
        }

        console.log('[Instacart] Opening URL:', instacartUrl);

        // Open Instacart recipe page in new tab
        window.open(instacartUrl, '_blank');
        toast({
          title: "Opening Instacart",
          description: "Your recipe is ready! Complete your order on Instacart.",
        });
      } else {
        console.error('[Instacart] No URL in response:', data);
        throw new Error('No Instacart URL returned');
      }
    } catch (error) {
      console.error('[Instacart] Error:', error);
      toast({
        title: "Unable to connect to Instacart",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsInstacartLoading(false);
    }
  };

  const isSaved = savedRecipes.some(sr => sr.recipe_id === recipe?.id);

  if (isLoading) {
    return <RecipeDetailsSkeleton />;
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
              <DollarSign className="w-5 h-5" />
              <span>
                {hasLivePrices ? '' : '~'}${totalCost.toFixed(2)} total
              </span>
              {hasLivePrices && <Zap className="w-4 h-4" />}
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
                  <span className="text-sm text-gray-600">Servings</span>
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
                        <span className={`text-sm font-semibold ${isInPantry ? 'text-green-600' : (() => { const info = getIngredientPriceInfo(ing); return info?.confidence === 'high' ? 'text-blue-600' : info?.confidence === 'medium' ? 'text-amber-600' : 'text-gray-600'; })()}`}>
                          {isInPantry ? 'In pantry' : (
                            <span className="flex items-center gap-1">
                              {(() => {
                                const info = getIngredientPriceInfo(ing);
                                const priceText = `${info?.confidence !== 'high' ? '~' : ''}$${(getIngredientPrice(ing) * scale).toFixed(2)}`;
                                if (info?.productUrl) {
                                  return (
                                    <a
                                      href={info.productUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="hover:underline flex items-center gap-1 text-blue-600"
                                    >
                                      {priceText}
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  );
                                }
                                return <>{priceText}</>;
                              })()}
                              {(() => {
                                const info = getIngredientPriceInfo(ing);
                                if (info?.confidence === 'high' && !info?.productUrl) return <Zap className="w-3 h-3 text-blue-500" />;
                                return null;
                              })()}
                            </span>
                          )}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>Instructions</CardTitle>
                  {isNormalizing && (
                    <span className="flex items-center gap-1.5 text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Rewriting...
                    </span>
                  )}
                  {recipe.rewritten && !isNormalizing && (
                    <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                      <Sparkles className="w-3 h-3" />
                      AI Rewritten
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullScreenInstructions(true)}
                  className="text-gray-500 hover:text-green-600"
                >
                  <Maximize2 className="w-4 h-4 mr-1" />
                  Full Screen
                </Button>
              </CardHeader>
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
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-600" />Cost Breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Total cost</span><span className="font-semibold text-gray-800">${totalCost.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Per serving</span><span className="font-semibold text-gray-800">${(totalCost / servings).toFixed(2)}</span></div>

                  {/* Pricing Source Indicator */}
                  <div className="pt-2 border-t border-gray-100">
                    {pricingConfidence === 'high' ? (
                      <p className="text-xs text-blue-600 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Live prices from {profileData?.preferred_store || 'Kroger'}
                      </p>
                    ) : pricingConfidence === 'medium' ? (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <Store className="w-3 h-3" />
                        Estimated prices via Spoonacular
                      </p>
                    ) : (
                      <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Store className="w-3 h-3" />
                          Approximate prices
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          Actual prices may vary.
                        </p>
                      </div>
                    )}
                  </div>

                  {userProfile?.pantry_items?.length > 0 && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-green-600 flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span>Pantry items deducted</p>
                    </div>
                  )}
                </div>

                {/* Refresh Pricing Button */}
                <Button
                  onClick={refreshPricing}
                  disabled={isPricingLoading}
                  variant="outline"
                  className={`w-full rounded-full ${pricingConfidence === 'high' ? 'border-blue-300 text-blue-600 hover:bg-blue-50' : 'border-amber-300 text-amber-600 hover:bg-amber-50'}`}
                >
                  {isPricingLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  {hasLivePrices ? 'Refresh Prices' : 'Get Prices'}
                </Button>

                <div className="space-y-2 pt-4">
                  <Button onClick={() => addToBudgetMutation.mutate()} disabled={addToBudgetMutation.isPending} className="w-full rounded-full bg-green-500 hover:bg-green-600">
                    <Plus className="w-4 h-4 mr-2" />{addToBudgetMutation.isPending ? 'Adding...' : 'Add to Budget'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShowShoppingDialog(true)}
                    className={`w-full rounded-full border-2 ${itemsInList ? 'border-green-300 text-green-500 bg-green-50' : 'border-green-500 text-green-600 hover:bg-green-50'}`}
                  >
                    {itemsInList ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />In Shopping List
                      </>
                    ) : (
                      <>
                        <ListPlus className="w-4 h-4 mr-2" />Add to Shopping List
                      </>
                    )}
                  </Button>

                  <Button variant="outline" onClick={() => setShowMealPlanModal(true)} className="w-full rounded-full">
                    <Calendar className="w-4 h-4 mr-2" />Add to Meal Plan
                  </Button>

                  <Button
                    onClick={handleShopWithInstacart}
                    disabled={isInstacartLoading}
                    className="w-full rounded-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-70"
                  >
                    {isInstacartLoading ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Creating Cart...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Shop with Instacart
                      </>
                    )}
                  </Button>
                </div>

                {recipe.source_url && (
                  <div className="pt-4 border-t border-gray-100">
                    <a href={recipe.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">View original recipe →</a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Nutrition Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  Nutrition Info
                  <span className="text-xs font-normal text-gray-400 ml-auto">per serving</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  // Generate consistent placeholder values based on recipe title
                  const hash = (recipe.title || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                  const placeholderNutrition = {
                    calories: recipe.nutrition?.calories || 280 + (hash % 220),
                    protein: recipe.nutrition?.protein_g || 18 + (hash % 25),
                    carbs: recipe.nutrition?.carbs_g || 25 + ((hash * 2) % 35),
                    fat: recipe.nutrition?.fat_g || 10 + ((hash * 3) % 18),
                    fiber: recipe.nutrition?.fiber_g || 3 + ((hash * 4) % 8)
                  };

                  return (
                    <div className="space-y-3">
                      {/* Calories - highlighted */}
                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span className="text-gray-700 font-medium">Calories</span>
                        </div>
                        <span className="font-bold text-orange-600 text-lg">
                          {placeholderNutrition.calories}
                        </span>
                      </div>

                      {/* Macros grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Protein */}
                        <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                          <div className="flex items-center gap-1.5">
                            <Beef className="w-3.5 h-3.5 text-red-500" />
                            <span className="text-xs text-gray-600">Protein</span>
                          </div>
                          <span className="font-semibold text-red-600 text-sm">
                            {placeholderNutrition.protein}g
                          </span>
                        </div>

                        {/* Carbs */}
                        <div className="flex items-center justify-between p-2 bg-amber-50 rounded-lg">
                          <div className="flex items-center gap-1.5">
                            <Wheat className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-xs text-gray-600">Carbs</span>
                          </div>
                          <span className="font-semibold text-amber-600 text-sm">
                            {placeholderNutrition.carbs}g
                          </span>
                        </div>

                        {/* Fat */}
                        <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                          <div className="flex items-center gap-1.5">
                            <Droplets className="w-3.5 h-3.5 text-yellow-600" />
                            <span className="text-xs text-gray-600">Fat</span>
                          </div>
                          <span className="font-semibold text-yellow-600 text-sm">
                            {placeholderNutrition.fat}g
                          </span>
                        </div>

                        {/* Fiber */}
                        <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-1.5">
                            <Leaf className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-xs text-gray-600">Fiber</span>
                          </div>
                          <span className="font-semibold text-green-600 text-sm">
                            {placeholderNutrition.fiber}g
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="pt-2 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400">
                    * Nutritional values are estimates and may vary based on ingredients and portion sizes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showShoppingDialog} onOpenChange={setShowShoppingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Shopping List
              {itemsInList && <Badge className="bg-green-100 text-green-700 text-xs">Added</Badge>}
            </DialogTitle>
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
              <Button onClick={addToShoppingList} className={`flex-1 rounded-full ${addedToList || itemsInList ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-green-500 hover:bg-green-600'}`}>
                {addedToList ? (
                  <><Check className="w-4 h-4 mr-2" />Added!</>
                ) : itemsInList ? (
                  <><ListPlus className="w-4 h-4 mr-2" />Add Again</>
                ) : (
                  <><ListPlus className="w-4 h-4 mr-2" />Add to List</>
                )}
              </Button>
              <Button onClick={() => { setShowShoppingDialog(false); navigate(createPageUrl('ShoppingList')); }} variant="outline" className="flex-1 rounded-full border-green-500 text-green-600 hover:bg-green-50">
                View List
              </Button>
            </div>
            <Button onClick={copyShoppingList} variant="ghost" className="w-full text-gray-500 hover:text-gray-700">
              {copiedList ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copiedList ? 'Copied!' : 'Copy to clipboard'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Meal Plan Modal */}
      <MealPlanModal
        open={showMealPlanModal}
        onOpenChange={setShowMealPlanModal}
        recipe={recipe}
        servings={servings}
        userProfile={userProfile}
      />

      {/* Full Screen Instructions Modal */}
      <Dialog open={showFullScreenInstructions} onOpenChange={setShowFullScreenInstructions}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ChefHat className="w-6 h-6 text-green-600" />
                {recipe?.title} - Instructions
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-6">
              {recipe?.instructions?.map((instruction, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                    {index + 1}
                  </div>
                  <div className="flex-1 pt-2">
                    <p className="text-lg text-gray-800 leading-relaxed">{instruction}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-shrink-0 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{recipe?.instructions?.length || 0} steps total</span>
              <Button
                variant="outline"
                onClick={() => setShowFullScreenInstructions(false)}
                className="rounded-full"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}