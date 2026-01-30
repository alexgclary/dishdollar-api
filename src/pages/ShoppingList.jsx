import React, { useState, useMemo } from 'react';
import { auth, entities } from '@/services';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { startOfWeek, addDays, format } from 'date-fns';
import { ShoppingCart, Check, Copy, ExternalLink, ArrowLeft, Plus, Trash2, Leaf, Beef, Milk, Package, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';

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
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [manualItems, setManualItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => format(addDays(currentWeekStart, i), 'yyyy-MM-dd'));

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

  const totalCost = aggregatedIngredients.reduce((sum, ing) => sum + ing.totalPrice, 0);
  const checkedCost = aggregatedIngredients.filter(ing => checkedItems.has(ing.name)).reduce((sum, ing) => sum + ing.totalPrice, 0);

  const copyList = () => {
    const text = aggregatedIngredients.map(i => `□ ${i.amount.toFixed(1)} ${i.unit} ${i.name}`).join('\n');
    navigator.clipboard.writeText(`Shopping List\n\n${text}`);
    toast({ title: "Copied!", description: "Shopping list copied to clipboard" });
  };

  const addManualItem = () => {
    if (!newItem.trim()) return;
    setManualItems([...manualItems, { id: Date.now(), name: newItem, checked: false }]);
    setNewItem('');
  };

  const allItems = [...aggregatedIngredients, ...manualItems.map(m => ({ name: m.name, amount: 1, unit: '', recipes: ['Manual'], totalPrice: 0 }))];

  if (allItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50 flex items-center justify-center p-6">
        <Card className="max-w-md text-center p-8">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">No items yet</h2>
          <p className="text-gray-500 mb-6">Plan some meals first or add items manually</p>
          <div className="flex gap-2 mb-4">
            <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addManualItem()} placeholder="Add item..." className="rounded-xl" />
            <Button onClick={addManualItem} className="rounded-full bg-green-500"><Plus className="w-5 h-5" /></Button>
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
                {checkedItems.size} of {allItems.length} items checked
              </span>
              <span className="text-sm text-gray-500">
                {allItems.length > 0 ? Math.round((checkedItems.size / allItems.length) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${allItems.length > 0 ? (checkedItems.size / allItems.length) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-gray-800">{allItems.length}</p><p className="text-sm text-gray-500">Items</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{checkedItems.size}</p><p className="text-sm text-gray-500">Checked</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-gray-800">${totalCost.toFixed(2)}</p><p className="text-sm text-gray-500">Est. Total</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">${(totalCost - checkedCost).toFixed(2)}</p><p className="text-sm text-gray-500">Remaining</p></CardContent></Card>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addManualItem()} placeholder="Add item manually..." className="rounded-xl" />
              <Button onClick={addManualItem} className="rounded-full bg-green-500 hover:bg-green-600"><Plus className="w-5 h-5" /></Button>
            </div>
          </CardContent>
        </Card>

        {manualItems.length > 0 && (
          <Card className="mb-6">
            <CardHeader><CardTitle>Added Items</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {manualItems.map((item) => (
                <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl ${checkedItems.has(item.name) ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <Checkbox checked={checkedItems.has(item.name)} onCheckedChange={(checked) => {
                    const newChecked = new Set(checkedItems);
                    checked ? newChecked.add(item.name) : newChecked.delete(item.name);
                    setCheckedItems(newChecked);
                  }} />
                  <span className={`flex-1 ${checkedItems.has(item.name) ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.name}</span>
                  <Button size="icon" variant="ghost" onClick={() => setManualItems(manualItems.filter(i => i.id !== item.id))} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {Object.entries(categorizedIngredients).filter(([_, items]) => items.length > 0).map(([category, items]) => {
          const CategoryIcon = CATEGORY_ICONS[category] || ShoppingBag;
          return (
            <Card key={category} className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CategoryIcon className={`w-5 h-5 ${category === 'Produce' ? 'text-green-600' : category === 'Meat & Seafood' ? 'text-red-600' : category === 'Dairy & Eggs' ? 'text-blue-600' : category === 'Pantry' ? 'text-amber-600' : 'text-gray-600'}`} />
                  <span>{category}</span>
                  <span className="text-sm font-normal text-gray-500">({items.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
              {items.map((ing, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${checkedItems.has(ing.name) ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <Checkbox checked={checkedItems.has(ing.name)} onCheckedChange={(checked) => {
                    const newChecked = new Set(checkedItems);
                    checked ? newChecked.add(ing.name) : newChecked.delete(ing.name);
                    setCheckedItems(newChecked);
                  }} />
                  <div className="flex-1">
                    <p className={`font-medium ${checkedItems.has(ing.name) ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {ing.amount.toFixed(1)} {ing.unit} {ing.name}
                    </p>
                    <p className="text-xs text-gray-500">For: {ing.recipes.join(', ')}</p>
                  </div>
                  <span className="text-green-600 font-semibold">${ing.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        );
        })}

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
                onClick={() => window.open('https://docs.instacart.com/developer_platform_api/', '_blank')}
                className="flex-1 rounded-full bg-green-600 hover:bg-green-700 text-white"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Checkout with Instacart
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}