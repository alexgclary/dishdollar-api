import React, { useState, useMemo, useEffect, useRef } from 'react';
import { auth, entities } from '@/services';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { startOfWeek, addDays, format } from 'date-fns';
import { ShoppingCart, Copy, ArrowLeft, Plus, Trash2, Leaf, Beef, Milk, Package, ShoppingBag, X, ChefHat, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { shoppingListStorage } from '@/utils/shoppingListStorage';

// Get API base URL from environment
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://budgetbite-api-69cb51842c10.herokuapp.com';

const CATEGORIES = {
  'Produce': ['onion', 'garlic', 'tomato', 'potato', 'carrot', 'celery', 'pepper', 'broccoli', 'spinach', 'lettuce', 'cucumber', 'avocado', 'lemon', 'lime', 'ginger', 'cilantro', 'basil', 'parsley', 'kale', 'mushroom'],
  'Meat & Seafood': ['chicken', 'beef', 'pork', 'turkey', 'bacon', 'sausage', 'salmon', 'shrimp', 'fish', 'tuna', 'steak', 'pancetta'],
  'Dairy & Eggs': ['milk', 'egg', 'butter', 'cheese', 'cream', 'yogurt', 'sour cream', 'parmesan', 'mozzarella'],
  'Pantry': ['rice', 'pasta', 'flour', 'sugar', 'oil', 'vinegar', 'sauce', 'broth', 'beans', 'honey', 'soy sauce', 'coconut milk', 'chickpeas', 'quinoa']
};

const CATEGORY_ICONS = {
  'Produce': Leaf,
  'Meat & Seafood': Beef,
  'Dairy & Eggs': Milk,
  'Pantry': Package,
  'Other': ShoppingBag
};

export default function ShoppingList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [persistedItems, setPersistedItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isInstacartLoading, setIsInstacartLoading] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => format(addDays(currentWeekStart, i), 'yyyy-MM-dd'));

  // Load persisted items from localStorage on mount
  useEffect(() => {
    setPersistedItems(shoppingListStorage.getItems());
  }, []);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update suggestions as user types
  useEffect(() => {
    if (newItem.length >= 2) {
      const matches = shoppingListStorage.getSuggestions(newItem, 8);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [newItem]);

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const user = await auth.me();
      const profiles = await entities.UserProfile.filter({ user_id: user.id });
      return profiles[0];
    }
  });

  const { data: mealPlans = [] } = useQuery({
    queryKey: ['mealPlans'],
    queryFn: async () => {
      const user = await auth.me();
      return entities.MealPlan.filter({ user_id: user.id });
    }
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => entities.Recipe.list()
  });

  const aggregatedIngredients = useMemo(() => {
    const weekMeals = mealPlans.filter(m => weekDays.includes(m.date));
    const ingredientMap = new Map();

    weekMeals.forEach(meal => {
      const recipe = recipes.find(r => r.id === meal.recipe_id);
      if (!recipe?.ingredients) return;

      recipe.ingredients.forEach(ing => {
        const key = `${ing.name.toLowerCase()}-${ing.unit || ''}`;
        const isInPantry = userProfile?.pantry_items?.some(p => ing.name.toLowerCase().includes(p.toLowerCase()));
        if (isInPantry) return;

        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key);
          existing.amount += (ing.amount || 1) * ((meal.servings || 4) / (recipe.servings || 4));
          existing.recipes.add(recipe.title);
          existing.totalPrice += (ing.estimated_price || 1.5) * ((meal.servings || 4) / (recipe.servings || 4));
        } else {
          ingredientMap.set(key, {
            name: ing.name,
            amount: (ing.amount || 1) * ((meal.servings || 4) / (recipe.servings || 4)),
            unit: ing.unit || '',
            recipes: new Set([recipe.title]),
            totalPrice: (ing.estimated_price || 1.5) * ((meal.servings || 4) / (recipe.servings || 4))
          });
        }
      });
    });

    return Array.from(ingredientMap.values()).map(ing => ({ ...ing, recipes: Array.from(ing.recipes) }));
  }, [mealPlans, recipes, userProfile, weekDays]);

  const categorizedIngredients = useMemo(() => {
    const result = { 'Produce': [], 'Meat & Seafood': [], 'Dairy & Eggs': [], 'Pantry': [], 'Other': [] };
    aggregatedIngredients.forEach(ing => {
      const name = ing.name.toLowerCase();
      let placed = false;
      for (const [category, keywords] of Object.entries(CATEGORIES)) {
        if (keywords.some(kw => name.includes(kw))) {
          result[category].push(ing);
          placed = true;
          break;
        }
      }
      if (!placed) result['Other'].push(ing);
    });
    return result;
  }, [aggregatedIngredients]);

  // Combine meal plan items with persisted items (avoiding duplicates)
  const combinedItems = useMemo(() => {
    const itemMap = new Map();

    // Add meal plan derived items
    aggregatedIngredients.forEach(ing => {
      const key = ing.name.toLowerCase();
      itemMap.set(key, {
        ...ing,
        id: `meal_${key}`,
        checked: false,
        source: 'Meal Plan',
        sources: ing.recipes
      });
    });

    // Merge persisted items
    persistedItems.forEach(item => {
      const key = item.name.toLowerCase();
      if (itemMap.has(key)) {
        // Merge sources
        const existing = itemMap.get(key);
        const allSources = new Set([...existing.sources, ...(item.sources || [item.source])]);
        existing.sources = Array.from(allSources);
        existing.checked = item.checked;
        existing.id = item.id;
      } else {
        itemMap.set(key, {
          name: item.name,
          amount: item.quantity || 1,
          unit: item.unit || '',
          recipes: item.sources || [item.source || 'Added'],
          sources: item.sources || [item.source || 'Added'],
          totalPrice: 0,
          id: item.id,
          checked: item.checked,
          source: item.source || 'Added'
        });
      }
    });

    return Array.from(itemMap.values());
  }, [aggregatedIngredients, persistedItems]);

  const checkedCount = combinedItems.filter(item => item.checked).length;
  const totalCost = combinedItems.reduce((sum, ing) => sum + (ing.totalPrice || 0), 0);
  const checkedCost = combinedItems.filter(ing => ing.checked).reduce((sum, ing) => sum + (ing.totalPrice || 0), 0);

  const copyList = () => {
    const text = combinedItems.map(i => `${i.checked ? '☑' : '☐'} ${i.amount ? i.amount.toFixed(1) : ''} ${i.unit || ''} ${i.name}`.trim()).join('\n');
    navigator.clipboard.writeText(`Shopping List\n\n${text}`);
    toast({ title: "Copied!", description: "Shopping list copied to clipboard" });
  };

  const addItem = (itemName) => {
    if (!itemName?.trim()) return;
    const items = shoppingListStorage.addItem({ name: itemName.trim(), source: 'manual' });
    setPersistedItems(items);
    setNewItem('');
    setShowSuggestions(false);
    toast({ title: "Added!", description: `${itemName} added to your list` });
  };

  const toggleItemCheck = (item) => {
    if (item.id?.startsWith('meal_')) {
      // For meal plan items, add to persisted storage to track checked state
      const existingItem = persistedItems.find(p => p.name.toLowerCase() === item.name.toLowerCase());
      if (existingItem) {
        const items = shoppingListStorage.toggleItem(existingItem.id);
        setPersistedItems(items);
      } else {
        // Add to storage with checked state
        const items = shoppingListStorage.addItem({ name: item.name, source: 'Meal Plan' });
        const newItem = items.find(i => i.name.toLowerCase() === item.name.toLowerCase());
        if (newItem) {
          const updated = shoppingListStorage.toggleItem(newItem.id);
          setPersistedItems(updated);
        }
      }
    } else {
      const items = shoppingListStorage.toggleItem(item.id);
      setPersistedItems(items);
    }
  };

  const removeItem = (item) => {
    if (!item.id?.startsWith('meal_')) {
      const items = shoppingListStorage.removeItem(item.id);
      setPersistedItems(items);
      toast({ title: "Removed", description: `${item.name} removed from list` });
    }
  };

  const clearChecked = () => {
    const items = shoppingListStorage.clearChecked();
    setPersistedItems(items);
    toast({ title: "Cleared", description: "Checked items removed" });
  };

  const clearAll = () => {
    const items = shoppingListStorage.clearAll();
    setPersistedItems([]);
    toast({ title: "Cleared", description: "Shopping list cleared" });
  };

  const removeRecipeItems = (recipeName) => {
    const items = shoppingListStorage.removeRecipeItems(recipeName);
    setPersistedItems(items);
    toast({ title: "Removed", description: `All items from "${recipeName}" removed` });
  };

  // Handle checkout with Instacart
  const handleCheckoutWithInstacart = async () => {
    console.log('[Instacart Shopping List] Starting checkout...');
    console.log('[Instacart Shopping List] API_BASE:', API_BASE);

    if (combinedItems.length === 0) {
      toast({
        title: "No items to checkout",
        description: "Add items to your shopping list first.",
        variant: "destructive"
      });
      return;
    }

    setIsInstacartLoading(true);
    try {
      // Collect all unchecked items for Instacart
      const itemsToCheckout = combinedItems
        .filter(item => !item.checked)
        .map(item => ({
          name: item.name,
          quantity: item.amount || 1,
          unit: item.unit || ''
        }));

      console.log('[Instacart Shopping List] Items to checkout:', itemsToCheckout);

      if (itemsToCheckout.length === 0) {
        toast({
          title: "All items checked",
          description: "Uncheck items you still need to purchase.",
        });
        setIsInstacartLoading(false);
        return;
      }

      const requestUrl = `${API_BASE}/api/instacart/shopping-list`;
      const requestBody = {
        title: 'DishDollar Shopping List',
        items: itemsToCheckout
      };

      console.log('[Instacart Shopping List] POST', requestUrl);
      console.log('[Instacart Shopping List] Request body:', requestBody);

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('[Instacart Shopping List] Response status:', response.status);

      const data = await response.json();
      console.log('[Instacart Shopping List] Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }

      if (data.url) {
        // Append retailer_key if user has a preferred retailer
        let instacartUrl = data.url;
        if (userProfile?.preferred_retailer_key) {
          const separator = instacartUrl.includes('?') ? '&' : '?';
          instacartUrl += `${separator}retailer_key=${userProfile.preferred_retailer_key}`;
        }

        console.log('[Instacart Shopping List] Opening URL:', instacartUrl);

        // Open Instacart in new tab
        window.open(instacartUrl, '_blank');
        toast({
          title: "Opening Instacart",
          description: `${itemsToCheckout.length} items ready for checkout!`,
        });
      } else {
        console.error('[Instacart Shopping List] No URL in response:', data);
        throw new Error('No Instacart URL returned');
      }
    } catch (error) {
      console.error('[Instacart Shopping List] Error:', error);
      toast({
        title: "Unable to connect to Instacart",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsInstacartLoading(false);
    }
  };

  // Group items by source for display
  const groupedItems = useMemo(() => {
    const groups = {};
    combinedItems.forEach(item => {
      const primarySource = item.source || item.sources?.[0] || 'Other';
      if (!groups[primarySource]) {
        groups[primarySource] = [];
      }
      groups[primarySource].push(item);
    });
    return groups;
  }, [combinedItems]);

  if (combinedItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50 flex items-center justify-center p-6">
        <Card className="max-w-md text-center p-8">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">No items yet</h2>
          <p className="text-gray-500 mb-6">Add items from recipes or type them in below</p>
          <div className="relative mb-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addItem(newItem)}
                onFocus={() => newItem.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Add item..."
                className="rounded-xl"
              />
              <Button onClick={() => addItem(newItem)} className="rounded-full bg-green-500"><Plus className="w-5 h-5" /></Button>
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div ref={suggestionsRef} className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-auto">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => addItem(suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-green-50 text-gray-700 first:rounded-t-xl last:rounded-b-xl"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button onClick={() => navigate(createPageUrl('MealPlanner'))} className="rounded-full bg-green-500">Go to Meal Planner</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button onClick={() => navigate(createPageUrl('MealPlanner'))} variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-green-600" />Shopping List
            </h1>
            <p className="text-gray-500">{userProfile?.preferred_store || 'Your grocery store'}</p>
          </div>
          <Button onClick={copyList} variant="outline" className="rounded-full"><Copy className="w-4 h-4 mr-2" />Copy</Button>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                {checkedCount} of {combinedItems.length} items checked
              </span>
              <span className="text-sm text-gray-500">
                {combinedItems.length > 0 ? Math.round((checkedCount / combinedItems.length) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${combinedItems.length > 0 ? (checkedCount / combinedItems.length) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-gray-800">{combinedItems.length}</p><p className="text-sm text-gray-500">Items</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{checkedCount}</p><p className="text-sm text-gray-500">Checked</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-gray-800">${totalCost.toFixed(2)}</p><p className="text-sm text-gray-500">Est. Total</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">${(totalCost - checkedCost).toFixed(2)}</p><p className="text-sm text-gray-500">Remaining</p></CardContent></Card>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-2 items-center justify-between mb-3">
              <h3 className="font-medium text-gray-700">Add Items</h3>
              <div className="flex gap-2">
                {combinedItems.length > 0 && (
                  <Button onClick={clearAll} variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                )}
                {checkedCount > 0 && (
                  <Button onClick={clearChecked} variant="outline" size="sm" className="text-orange-500 border-orange-200 hover:bg-orange-50">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear Checked ({checkedCount})
                  </Button>
                )}
              </div>
            </div>
            <div className="relative">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addItem(newItem)}
                  onFocus={() => newItem.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Type to search or add item..."
                  className="rounded-xl"
                />
                <Button onClick={() => addItem(newItem)} className="rounded-full bg-green-500 hover:bg-green-600"><Plus className="w-5 h-5" /></Button>
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div ref={suggestionsRef} className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-auto">
                  {suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => addItem(suggestion)}
                      className="w-full px-4 py-2 text-left hover:bg-green-50 text-gray-700 first:rounded-t-xl last:rounded-b-xl flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4 text-green-500" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Items grouped by source (recipe name) */}
        {Object.entries(groupedItems).map(([source, items]) => {
          const isRecipeSource = source !== 'manual' && source !== 'Added' && source !== 'Meal Plan';
          const SourceIcon = isRecipeSource ? ChefHat : (source === 'Meal Plan' ? ShoppingCart : ShoppingBag);

          return (
            <Card key={source} className="mb-6">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <SourceIcon className={`w-5 h-5 ${isRecipeSource ? 'text-amber-600' : source === 'Meal Plan' ? 'text-green-600' : 'text-gray-500'}`} />
                    <span>{source === 'manual' ? 'Added Items' : source}</span>
                    <span className="text-sm font-normal text-gray-500">({items.length})</span>
                  </CardTitle>
                  {isRecipeSource && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeRecipeItems(source)}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-8 px-2"
                      title={`Remove all items from ${source}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${item.checked ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() => toggleItemCheck(item)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {item.amount ? `${item.amount.toFixed(1)}${item.unit ? ` ${item.unit}` : ''} ` : ''}{item.name}
                      </p>
                      {item.sources && item.sources.length > 1 && (
                        <p className="text-xs text-gray-500 truncate">Also in: {item.sources.filter(s => s !== source).join(', ')}</p>
                      )}
                    </div>
                    {item.totalPrice > 0 && (
                      <span className="text-green-600 font-semibold text-sm">${item.totalPrice.toFixed(2)}</span>
                    )}
                    {!item.id?.startsWith('meal_') && (
                      <Button size="icon" variant="ghost" onClick={() => removeItem(item)} className="text-gray-400 hover:text-red-500 h-8 w-8">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}

        {/* Categorized view for meal plan items */}
        {aggregatedIngredients.length > 0 && Object.entries(categorizedIngredients).filter(([_, items]) => items.length > 0).length > 0 && (
          <details className="mb-6">
            <summary className="cursor-pointer text-sm text-gray-500 mb-3 hover:text-gray-700">
              View by grocery category
            </summary>
            {Object.entries(categorizedIngredients).filter(([_, items]) => items.length > 0).map(([category, items]) => {
              const CategoryIcon = CATEGORY_ICONS[category] || ShoppingBag;
              return (
                <Card key={category} className="mb-4">
                  <CardHeader className="py-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CategoryIcon className={`w-4 h-4 ${category === 'Produce' ? 'text-green-600' : category === 'Meat & Seafood' ? 'text-red-600' : category === 'Dairy & Eggs' ? 'text-blue-600' : category === 'Pantry' ? 'text-amber-600' : 'text-gray-600'}`} />
                      <span>{category}</span>
                      <span className="text-sm font-normal text-gray-500">({items.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-1">
                    {items.map((ing, i) => {
                      const isChecked = combinedItems.find(item => item.name.toLowerCase() === ing.name.toLowerCase())?.checked;
                      return (
                        <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${isChecked ? 'bg-green-50 text-gray-400' : 'bg-gray-50'}`}>
                          <span className={isChecked ? 'line-through' : ''}>
                            {ing.amount.toFixed(1)} {ing.unit} {ing.name}
                          </span>
                          {ing.totalPrice > 0 && (
                            <span className="ml-auto text-green-600">${ing.totalPrice.toFixed(2)}</span>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </details>
        )}

        <Card className="bg-white shadow-lg border-2 border-green-500">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Button
                onClick={copyList}
                variant="outline"
                className="flex-1 rounded-full border-2 border-green-500 text-green-600 hover:bg-green-50"
              >
                <Copy className="w-5 h-5 mr-2" />
                Copy to Clipboard
              </Button>

              <Button
                onClick={handleCheckoutWithInstacart}
                disabled={isInstacartLoading || combinedItems.filter(i => !i.checked).length === 0}
                className="flex-1 rounded-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-70"
              >
                {isInstacartLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Creating List...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Checkout with Instacart
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}