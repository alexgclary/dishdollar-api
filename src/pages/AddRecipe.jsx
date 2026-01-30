import React, { useState } from 'react';
import { auth, entities } from '@/services';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Link as LinkIcon, Loader2, Sparkles, Check, Plus, Trash2, PenLine, DollarSign, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { FloatingVegetables } from '@/components/ui/DecorativeElements';
import PillSelector from '@/components/onboarding/PillSelector';
import { parseRecipeWithPrices, hasRealTimePricing, getRecipePricing } from '@/components/utils/pricingDatabase';

const supportedSites = ['Allrecipes', 'NYT Cooking', 'Epicurious', 'Serious Eats', 'Bon Appetit', 'Food Network', 'Simply Recipes', 'Half Baked Harvest', 'Budget Bytes', 'Skinnytaste', 'BBC Good Food'];

const cuisineOptions = [
  { value: 'Italian', icon: '🍝' }, { value: 'Mexican', icon: '🌮' }, { value: 'Indian', icon: '🍛' },
  { value: 'Chinese', icon: '🥡' }, { value: 'American', icon: '🍔' }, { value: 'Mediterranean', icon: '🥙' },
  { value: 'Japanese', icon: '🍣' }, { value: 'Thai', icon: '🍜' }, { value: 'French', icon: '🥐' }, { value: 'Korean', icon: '🍲' }
];

const dietOptions = [
  { value: 'Vegetarian', icon: '🥬' }, { value: 'Vegan', icon: '🌱' }, { value: 'Keto', icon: '🥑' },
  { value: 'Gluten-Free', icon: '🌾' }, { value: 'Dairy-Free', icon: '🥛' }, { value: 'Low-Carb', icon: '🍞' }
];

export default function AddRecipe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [pantryItems, setPantryItems] = useState([]);
  const [parseError, setParseError] = useState(null);

  const [manualRecipe, setManualRecipe] = useState({
    title: '', description: '', image_url: '', prep_time: 15, cook_time: 30, servings: 4,
    cuisines: [], diets: [],
    ingredients: [{ name: '', amount: '', unit: '', estimated_price: '' }],
    instructions: ['']
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const user = await auth.me();
      const profiles = await entities.UserProfile.filter({ user_id: user.id });
      return profiles[0];
    }
  });

  const hasRealtimePricing = userProfile?.preferred_store && hasRealTimePricing(userProfile.preferred_store);

  const handleExtract = async () => {
    if (!url.trim()) {
      toast({ title: "Missing URL", description: "Please enter a recipe URL", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    setExtractedData(null);
    setParseError(null);

    try {
      // Use the new endpoint that searches Kroger for each ingredient
      let recipe = await parseRecipeWithPrices(url, userProfile);

      if (!recipe?.title) throw new Error('Could not extract recipe from this URL. The site may not be supported or the page may be behind a paywall.');

      setExtractedData(recipe);
      setPantryItems([]);
      toast({ title: "Recipe Extracted!", description: `Found: ${recipe.title}` });
    } catch (error) {
      console.error('Extraction error:', error);
      const errorMessage = error.message || 'Could not extract recipe. Please try a different URL or add the recipe manually.';
      setParseError(errorMessage);
      toast({ title: "Extraction Failed", description: "Check the error message below", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const saveRecipeMutation = useMutation({
    mutationFn: async (recipeData) => {
      const totalCost = recipeData.ingredients?.reduce((sum, ing) => sum + (parseFloat(ing.estimated_price) || 0), 0) || recipeData.total_cost || 0;
      return entities.Recipe.create({ ...recipeData, total_cost: totalCost, is_custom: true });
    },
    onSuccess: (recipe) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast({ title: "Recipe Saved!" });
      navigate(createPageUrl('RecipeDetails') + `?id=${recipe.id}`);
    },
    onError: () => toast({ title: "Error", description: "Failed to save recipe.", variant: "destructive" })
  });

  const handleSaveManual = async () => {
    if (!manualRecipe.title.trim()) {
      toast({ title: "Missing Title", variant: "destructive" });
      return;
    }
    const validIngredients = manualRecipe.ingredients.filter(i => i.name.trim());
    if (validIngredients.length === 0) {
      toast({ title: "No Ingredients", variant: "destructive" });
      return;
    }
    
    try {
      const pricing = await getRecipePricing(validIngredients.map(i => ({ name: i.name, amount: parseFloat(i.amount) || 1, unit: i.unit || 'unit' })), userProfile);
      const cleanedRecipe = {
        ...manualRecipe,
        ingredients: validIngredients.map((i, idx) => ({
          name: i.name, amount: parseFloat(i.amount) || 1, unit: i.unit || 'unit',
          estimated_price: i.estimated_price ? parseFloat(i.estimated_price) : pricing.breakdown?.[idx]?.estimatedPrice || 1.50
        })),
        instructions: manualRecipe.instructions.filter(i => i.trim()),
        total_cost: pricing.totalCost
      };
      saveRecipeMutation.mutate(cleanedRecipe);
    } catch (error) {
      console.error('Pricing error:', error);
      // Fallback without pricing
      const cleanedRecipe = {
        ...manualRecipe,
        ingredients: validIngredients.map(i => ({
          name: i.name, amount: parseFloat(i.amount) || 1, unit: i.unit || 'unit',
          estimated_price: i.estimated_price ? parseFloat(i.estimated_price) : 1.50
        })),
        instructions: manualRecipe.instructions.filter(i => i.trim()),
        total_cost: validIngredients.reduce((sum, i) => sum + (parseFloat(i.estimated_price) || 1.50), 0)
      };
      saveRecipeMutation.mutate(cleanedRecipe);
    }
  };

  const updateIngredient = (index, field, value) => {
    const newIngredients = [...manualRecipe.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setManualRecipe({ ...manualRecipe, ingredients: newIngredients });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50 relative overflow-hidden">
      <FloatingVegetables />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button onClick={() => navigate(createPageUrl('Home'))} variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Add Recipe</h1>
            <p className="text-gray-500">Import from URL or create your own</p>
          </div>
        </div>

        {userProfile && (
          <Card className={`mb-6 ${hasRealtimePricing ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
            <CardContent className="p-4 flex items-center gap-3">
              {hasRealtimePricing ? (
                <><Zap className="w-5 h-5 text-green-600" /><div><p className="font-medium text-green-800">Real-time pricing enabled</p><p className="text-sm text-green-600">Using live prices from {userProfile.preferred_store}</p></div></>
              ) : (
                <><DollarSign className="w-5 h-5 text-blue-600" /><div><p className="font-medium text-blue-800">Using estimated prices</p><p className="text-sm text-blue-600">Switch to Kroger-family store for real-time pricing</p></div></>
              )}
            </CardContent>
          </Card>
        )}

        {!extractedData ? (
          <Tabs defaultValue="url" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url"><LinkIcon className="w-4 h-4 mr-2" />Import from URL</TabsTrigger>
              <TabsTrigger value="manual"><PenLine className="w-4 h-4 mr-2" />Create Manually</TabsTrigger>
            </TabsList>

            <TabsContent value="url">
              <Card className="border-0 shadow-xl">
                <CardHeader><CardTitle><LinkIcon className="w-5 h-5 text-green-600 inline mr-2" />Paste Recipe URL</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.allrecipes.com/recipe/..." className="text-lg h-14 rounded-xl border-2" disabled={isProcessing} />
                    <Button onClick={handleExtract} disabled={isProcessing || !url.trim()} className="w-full h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-lg font-semibold">
                      {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Extracting...</> : <><Sparkles className="w-5 h-5 mr-2" />Extract Recipe</>}
                    </Button>
                  </div>

                  {parseError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 rounded-xl p-6"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-red-800 mb-1">
                            Failed to Parse Recipe
                          </h3>
                          <p className="text-red-600 text-sm mb-3">
                            {parseError}
                          </p>
                          <button
                            onClick={() => {
                              setParseError(null);
                              setUrl('');
                            }}
                            className="border border-red-300 text-red-700 hover:bg-red-50 h-9 px-4 text-sm rounded-md font-medium transition-colors"
                          >
                            Try Again
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="pt-6 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-3">Works great with:</p>
                    <div className="flex flex-wrap gap-2">
                      {supportedSites.map(site => <span key={site} className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">{site}</span>)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manual">
              <Card className="border-0 shadow-xl">
                <CardHeader><CardTitle><PenLine className="w-5 h-5 text-green-600 inline mr-2" />Create Recipe</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><Label>Title *</Label><Input value={manualRecipe.title} onChange={(e) => setManualRecipe({ ...manualRecipe, title: e.target.value })} placeholder="Recipe name" className="mt-1 rounded-xl" /></div>
                    <div className="md:col-span-2"><Label>Description</Label><Textarea value={manualRecipe.description} onChange={(e) => setManualRecipe({ ...manualRecipe, description: e.target.value })} className="mt-1 rounded-xl" /></div>
                    <div><Label>Prep (min)</Label><Input type="number" value={manualRecipe.prep_time} onChange={(e) => setManualRecipe({ ...manualRecipe, prep_time: parseInt(e.target.value) || 0 })} className="mt-1 rounded-xl" /></div>
                    <div><Label>Cook (min)</Label><Input type="number" value={manualRecipe.cook_time} onChange={(e) => setManualRecipe({ ...manualRecipe, cook_time: parseInt(e.target.value) || 0 })} className="mt-1 rounded-xl" /></div>
                    <div><Label>Servings</Label><Input type="number" value={manualRecipe.servings} onChange={(e) => setManualRecipe({ ...manualRecipe, servings: parseInt(e.target.value) || 1 })} className="mt-1 rounded-xl" /></div>
                  </div>
                  <div><Label>Cuisines</Label><div className="mt-2"><PillSelector options={cuisineOptions.map(c => ({ value: c.value, label: `${c.icon} ${c.value}` }))} selected={manualRecipe.cuisines} onChange={(v) => setManualRecipe({ ...manualRecipe, cuisines: v })} columns={5} /></div></div>
                  <div><Label>Diets</Label><div className="mt-2"><PillSelector options={dietOptions.map(d => ({ value: d.value, label: `${d.icon} ${d.value}` }))} selected={manualRecipe.diets} onChange={(v) => setManualRecipe({ ...manualRecipe, diets: v })} columns={3} /></div></div>
                  <div>
                    <Label>Ingredients (leave price blank for auto-estimate)</Label>
                    <div className="space-y-2 mt-2">
                      {manualRecipe.ingredients.map((ing, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <Input placeholder="Qty" value={ing.amount} onChange={(e) => updateIngredient(i, 'amount', e.target.value)} className="w-16 rounded-xl" />
                          <Input placeholder="Unit" value={ing.unit} onChange={(e) => updateIngredient(i, 'unit', e.target.value)} className="w-20 rounded-xl" />
                          <Input placeholder="Ingredient" value={ing.name} onChange={(e) => updateIngredient(i, 'name', e.target.value)} className="flex-1 rounded-xl" />
                          <Input placeholder="$" value={ing.estimated_price} onChange={(e) => updateIngredient(i, 'estimated_price', e.target.value)} className="w-16 rounded-xl" />
                          <Button variant="ghost" size="icon" onClick={() => setManualRecipe({ ...manualRecipe, ingredients: manualRecipe.ingredients.filter((_, idx) => idx !== i) })} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      ))}
                      <Button variant="outline" onClick={() => setManualRecipe({ ...manualRecipe, ingredients: [...manualRecipe.ingredients, { name: '', amount: '', unit: '', estimated_price: '' }] })} className="rounded-xl"><Plus className="w-4 h-4 mr-2" />Add</Button>
                    </div>
                  </div>
                  <div>
                    <Label>Instructions</Label>
                    <div className="space-y-2 mt-2">
                      {manualRecipe.instructions.map((inst, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold text-xs mt-2">{i + 1}</span>
                          <Textarea value={inst} onChange={(e) => { const arr = [...manualRecipe.instructions]; arr[i] = e.target.value; setManualRecipe({ ...manualRecipe, instructions: arr }); }} className="flex-1 rounded-xl" rows={2} />
                          <Button variant="ghost" size="icon" onClick={() => setManualRecipe({ ...manualRecipe, instructions: manualRecipe.instructions.filter((_, idx) => idx !== i) })} className="text-red-500 mt-1"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      ))}
                      <Button variant="outline" onClick={() => setManualRecipe({ ...manualRecipe, instructions: [...manualRecipe.instructions, ''] })} className="rounded-xl"><Plus className="w-4 h-4 mr-2" />Add Step</Button>
                    </div>
                  </div>
                  <Button onClick={handleSaveManual} disabled={saveRecipeMutation.isPending} className="w-full h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-lg font-semibold">
                    {saveRecipeMutation.isPending ? 'Saving...' : 'Save Recipe'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center gap-2 text-green-800"><Check className="w-6 h-6" />Recipe Extracted!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <img 
                      src={extractedData.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} 
                      alt={extractedData.title} 
                      className="w-full h-48 object-cover rounded-xl"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'; }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{extractedData.title}</h2>
                    <p className="text-gray-600 mb-4 line-clamp-2">{extractedData.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {extractedData.cuisines?.map(c => <Badge key={c} className="bg-amber-100 text-amber-800">{c}</Badge>)}
                      {extractedData.diets?.map(d => <Badge key={d} className="bg-green-100 text-green-800">{d}</Badge>)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-xl"><p className="text-sm text-gray-600">Prep</p><p className="text-xl font-bold text-blue-600">{extractedData.prep_time}m</p></div>
                  <div className="text-center p-4 bg-purple-50 rounded-xl"><p className="text-sm text-gray-600">Cook</p><p className="text-xl font-bold text-purple-600">{extractedData.cook_time}m</p></div>
                  <div className="text-center p-4 bg-amber-50 rounded-xl"><p className="text-sm text-gray-600">Servings</p><p className="text-xl font-bold text-amber-600">{extractedData.servings}</p></div>
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <p className="text-sm text-gray-600">Est. Cost</p>
                    <p className="text-xl font-bold text-green-600">
                      ${(extractedData.ingredients?.reduce((sum, ing, i) => 
                        pantryItems.includes(i) ? sum : sum + (ing.estimated_price || 2.50), 0
                      ) || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Ingredients with Kroger product links */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Ingredients</h3>
                  <p className="text-xs text-gray-500 mb-3">Tap an ingredient to toggle "In Pantry" status</p>
                  <div className="space-y-2">
                    {extractedData.ingredients?.map((ing, index) => {
                      const isInPantry = pantryItems.includes(index);
                      return (
                        <div 
                          key={index} 
                          onClick={() => setPantryItems(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index])}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${isInPantry ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 border-2 border-transparent hover:border-green-300'}`}
                        >
                          <div className="flex-1">
                            <div className={`font-medium ${isInPantry ? 'text-green-800' : 'text-gray-800'}`}>
                              {ing.original || `${ing.amount} ${ing.unit} ${ing.name}`}
                            </div>
                            {ing.krogerProduct && (
                              <a 
                                href={ing.krogerProduct.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-gray-400 hover:text-green-600 hover:underline block mt-1"
                              >
                                {ing.krogerProduct.name} - ${ing.krogerProduct.price?.toFixed(2)}
                              </a>
                            )}
                          </div>
                          <span className={`font-semibold ${isInPantry ? 'text-green-600' : 'text-green-600'}`}>
                            {isInPantry ? 'In pantry' : `$${(ing.estimated_price || 2.50).toFixed(2)}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* For Serving section */}
                {extractedData.servingIngredients?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">For Serving</h4>
                    <div className="space-y-2">
                      {extractedData.servingIngredients.map((ing, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                          <div className="flex-1">
                            <span className="text-gray-700">{ing.original || ing.name}</span>
                            {ing.krogerProduct && (
                              <a 
                                href={ing.krogerProduct.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-2 text-sm text-gray-400 hover:text-green-600 hover:underline"
                              >
                                {ing.krogerProduct.name}
                              </a>
                            )}
                          </div>
                          <span className="text-amber-600 text-sm">optional</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing info */}
                {extractedData.pricing && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Pricing:</strong> {extractedData.pricing.source === 'kroger' 
                        ? `${extractedData.pricing.krogerItemsFound}/${extractedData.pricing.totalIngredients} items found at ${extractedData.pricing.storeChain}` 
                        : 'Estimated prices (no Kroger location set)'}
                    </p>
                    <p className="text-xs text-gray-500">Confidence: {extractedData.pricing.confidence}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button onClick={() => { setExtractedData(null); setUrl(''); }} variant="outline" className="flex-1 rounded-xl">Try Another</Button>
                  <Button onClick={() => saveRecipeMutation.mutate(extractedData)} disabled={saveRecipeMutation.isPending} className="flex-1 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
                    {saveRecipeMutation.isPending ? 'Saving...' : 'Save Recipe'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}