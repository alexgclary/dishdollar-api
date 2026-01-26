import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Sparkles, ChefHat, TrendingUp, BookOpen, Calendar, Compass, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import RecipeCard from '@/components/recipes/RecipeCard';
import RecipeFilters from '@/components/recipes/RecipeFilters';
import BudgetTracker from '@/components/budget/BudgetTracker';

// Sample recipes to seed when none exist
const sampleRecipes = [
  {
    title: "Classic Spaghetti Carbonara",
    description: "A creamy Italian pasta dish with crispy pancetta and parmesan",
    image_url: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800",
    cuisines: ["Italian"],
    diets: [],
    prep_time: 15,
    cook_time: 20,
    servings: 4,
    total_cost: 12.50,
    ingredients: [
      { name: "Spaghetti", amount: 1, unit: "lb", estimated_price: 2.00 },
      { name: "Pancetta", amount: 8, unit: "oz", estimated_price: 5.00 },
      { name: "Eggs", amount: 4, unit: "large", estimated_price: 1.50 },
      { name: "Parmesan cheese", amount: 1, unit: "cup", estimated_price: 4.00 }
    ],
    instructions: ["Cook pasta according to package", "Fry pancetta until crispy", "Mix eggs with cheese", "Toss hot pasta with egg mixture and pancetta"]
  },
  {
    title: "Thai Green Curry",
    description: "Fragrant coconut curry with vegetables and your choice of protein",
    image_url: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800",
    cuisines: ["Thai"],
    diets: ["Gluten-Free"],
    prep_time: 20,
    cook_time: 25,
    servings: 4,
    total_cost: 15.00,
    ingredients: [
      { name: "Coconut milk", amount: 2, unit: "cans", estimated_price: 4.00 },
      { name: "Green curry paste", amount: 3, unit: "tbsp", estimated_price: 3.00 },
      { name: "Chicken breast", amount: 1, unit: "lb", estimated_price: 5.00 },
      { name: "Mixed vegetables", amount: 2, unit: "cups", estimated_price: 3.00 }
    ],
    instructions: ["Sauté curry paste in oil", "Add coconut milk and simmer", "Add protein and vegetables", "Serve over rice"]
  },
  {
    title: "Mexican Street Tacos",
    description: "Authentic corn tortilla tacos with cilantro and onion",
    image_url: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800",
    cuisines: ["Mexican"],
    diets: ["Gluten-Free"],
    prep_time: 15,
    cook_time: 20,
    servings: 4,
    total_cost: 10.00,
    ingredients: [
      { name: "Corn tortillas", amount: 12, unit: "small", estimated_price: 2.50 },
      { name: "Skirt steak", amount: 1, unit: "lb", estimated_price: 8.00 },
      { name: "Cilantro", amount: 1, unit: "bunch", estimated_price: 1.00 },
      { name: "White onion", amount: 1, unit: "medium", estimated_price: 0.50 }
    ],
    instructions: ["Season and grill meat", "Warm tortillas", "Dice onion and chop cilantro", "Assemble tacos with toppings"]
  },
  {
    title: "Buddha Bowl",
    description: "Nutritious grain bowl with roasted vegetables and tahini dressing",
    image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
    cuisines: ["Mediterranean"],
    diets: ["Vegan", "Vegetarian", "Gluten-Free"],
    prep_time: 20,
    cook_time: 30,
    servings: 2,
    total_cost: 8.00,
    ingredients: [
      { name: "Quinoa", amount: 1, unit: "cup", estimated_price: 2.00 },
      { name: "Chickpeas", amount: 1, unit: "can", estimated_price: 1.50 },
      { name: "Sweet potato", amount: 1, unit: "large", estimated_price: 1.50 },
      { name: "Kale", amount: 2, unit: "cups", estimated_price: 2.00 },
      { name: "Tahini", amount: 2, unit: "tbsp", estimated_price: 1.00 }
    ],
    instructions: ["Cook quinoa", "Roast chickpeas and sweet potato", "Massage kale with olive oil", "Assemble bowls and drizzle with tahini"]
  },
  {
    title: "Chicken Tikka Masala",
    description: "Tender chicken in a creamy, spiced tomato sauce",
    image_url: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800",
    cuisines: ["Indian"],
    diets: ["Gluten-Free"],
    prep_time: 30,
    cook_time: 40,
    servings: 4,
    total_cost: 14.00,
    ingredients: [
      { name: "Chicken thighs", amount: 1.5, unit: "lb", estimated_price: 6.00 },
      { name: "Greek yogurt", amount: 1, unit: "cup", estimated_price: 2.00 },
      { name: "Tomato sauce", amount: 2, unit: "cups", estimated_price: 2.50 },
      { name: "Heavy cream", amount: 0.5, unit: "cup", estimated_price: 2.00 },
      { name: "Garam masala", amount: 2, unit: "tbsp", estimated_price: 1.50 }
    ],
    instructions: ["Marinate chicken in yogurt and spices", "Grill or bake chicken", "Simmer tomato sauce with spices", "Add cream and chicken, serve with rice"]
  },
  {
    title: "Japanese Teriyaki Salmon",
    description: "Glazed salmon with homemade teriyaki sauce",
    image_url: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800",
    cuisines: ["Japanese"],
    diets: ["Pescatarian", "Dairy-Free"],
    prep_time: 10,
    cook_time: 15,
    servings: 2,
    total_cost: 16.00,
    ingredients: [
      { name: "Salmon fillets", amount: 2, unit: "pieces", estimated_price: 12.00 },
      { name: "Soy sauce", amount: 0.25, unit: "cup", estimated_price: 1.00 },
      { name: "Mirin", amount: 2, unit: "tbsp", estimated_price: 1.50 },
      { name: "Brown sugar", amount: 2, unit: "tbsp", estimated_price: 0.50 },
      { name: "Ginger", amount: 1, unit: "inch", estimated_price: 1.00 }
    ],
    instructions: ["Mix teriyaki sauce ingredients", "Pan sear salmon", "Glaze with sauce while cooking", "Serve with steamed rice"]
  }
];

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ cuisines: [], diets: [], maxCost: null, maxTime: null });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch user profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
      return profiles[0];
    }
  });

  // Fetch recipes
  const { data: recipes = [], isLoading: recipesLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => base44.entities.Recipe.list('-created_date', 50)
  });

  // Fetch saved recipes
  const { data: savedRecipes = [] } = useQuery({
    queryKey: ['savedRecipes'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.SavedRecipe.filter({ user_id: user.id });
    }
  });

  // Fetch budget entries
  const { data: budgetEntries = [] } = useQuery({
    queryKey: ['budgetEntries'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.BudgetEntry.filter({ user_id: user.id });
    }
  });

  // Seed sample recipes if none exist
  const seedRecipesMutation = useMutation({
    mutationFn: async () => {
      for (const recipe of sampleRecipes) {
        await base44.entities.Recipe.create(recipe);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast({
        title: "Sample Recipes Added!",
        description: "We've added some delicious recipes to get you started"
      });
    }
  });

  // Save recipe mutation
  const saveRecipeMutation = useMutation({
    mutationFn: async (recipe) => {
      const user = await base44.auth.me();
      const existing = savedRecipes.find(sr => sr.recipe_id === recipe.id);
      if (existing) {
        return base44.entities.SavedRecipe.delete(existing.id);
      } else {
        return base44.entities.SavedRecipe.create({
          user_id: user.id,
          recipe_id: recipe.id,
          saved_at: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedRecipes'] });
    }
  });

  useEffect(() => {
    if (profileData && !profileData.onboarding_completed) {
      navigate(createPageUrl('Onboarding'));
    }
  }, [profileData, navigate]);
  
  useEffect(() => {
    if (!profileLoading && profileData === null) {
      navigate(createPageUrl('Onboarding'));
    }
  }, [profileLoading, profileData, navigate]);

  // Seed recipes if empty
  useEffect(() => {
    if (!recipesLoading && recipes.length === 0 && !seedRecipesMutation.isPending) {
      seedRecipesMutation.mutate();
    }
  }, [recipesLoading, recipes.length]);

  // Filter recipes based on search and filters
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = !searchQuery || 
      recipe.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.cuisines?.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    
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

  // Personalized recipes (matching user preferences)
  const personalizedRecipes = filteredRecipes.filter(recipe => {
    if (!profileData?.cuisines?.length && !profileData?.dietary_restrictions?.length) return true;
    
    const matchesCuisine = !profileData.cuisines?.length || 
      recipe.cuisines?.some(c => profileData.cuisines.includes(c));
    const matchesDiet = !profileData.dietary_restrictions?.length ||
      profileData.dietary_restrictions.includes('No Restrictions') ||
      recipe.diets?.some(d => profileData.dietary_restrictions.includes(d));
    return matchesCuisine || matchesDiet;
  });

  // Explore recipes (outside user preferences for discovery)
  const exploreRecipes = filteredRecipes.filter(recipe => {
    if (!profileData?.cuisines?.length) return false;
    return !recipe.cuisines?.some(c => profileData.cuisines?.includes(c));
  });

  // Calculate budget stats
  const calculateBudgetStats = () => {
    if (!profileData) return { spent: 0, budget: 150, daysRemaining: 7 };
    
    const now = new Date();
    let periodStart;
    let periodDays;
    
    if (profileData.budget_type === 'weekly') {
      periodDays = 7;
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - now.getDay());
    } else if (profileData.budget_type === 'monthly') {
      periodDays = 30;
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      periodDays = profileData.budget_days || 7;
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - periodDays);
    }
    
    const spent = budgetEntries
      .filter(entry => new Date(entry.date) >= periodStart)
      .reduce((sum, entry) => sum + (entry.amount || 0), 0);
    
    const daysPassed = Math.floor((now - periodStart) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(periodDays - daysPassed, 0);
    
    return {
      spent,
      budget: profileData.budget_amount || 150,
      daysRemaining,
      budgetType: profileData.budget_type || 'weekly'
    };
  };

  const budgetStats = calculateBudgetStats();
  const activeFiltersCount = filters.cuisines.length + filters.diets.length + (filters.maxCost ? 1 : 0) + (filters.maxTime ? 1 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-500 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-6xl">🥕</div>
          <div className="absolute top-20 right-20 text-5xl">🥬</div>
          <div className="absolute bottom-10 left-1/4 text-4xl">🍅</div>
          <div className="absolute bottom-20 right-1/3 text-5xl">🌽</div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {profileData?.full_name ? `Hey ${profileData.full_name.split(' ')[0]}!` : 'Welcome!'} 👋
            </h1>
            <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
              Discover delicious recipes that fit your budget and dietary preferences
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipes or cuisines..."
                className="w-full pl-12 pr-4 py-6 text-lg rounded-full border-0 shadow-xl text-gray-800"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 -mt-8 mb-8 relative z-10">
          <Link to={createPageUrl('AddRecipe')}>
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 cursor-pointer"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Add Recipe</h3>
              <p className="text-sm text-gray-500">Import from URL</p>
            </motion.div>
          </Link>
          
          <Link to={createPageUrl('SavedRecipes')}>
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 cursor-pointer"
            >
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-semibold text-gray-800">My Recipes</h3>
              <p className="text-sm text-gray-500">{savedRecipes.length} saved</p>
            </motion.div>
          </Link>

          <Link to={createPageUrl('MealPlanner')}>
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 cursor-pointer"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Meal Plan</h3>
              <p className="text-sm text-gray-500">Plan your week</p>
            </motion.div>
          </Link>
          
          <Link to={createPageUrl('Budget')}>
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 cursor-pointer"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Budget</h3>
              <p className="text-sm text-gray-500">${budgetStats.spent.toFixed(0)} spent</p>
            </motion.div>
          </Link>
          
          <Link to={createPageUrl('Profile')}>
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 cursor-pointer"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                <ChefHat className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Profile</h3>
              <p className="text-sm text-gray-500">Edit preferences</p>
            </motion.div>
          </Link>
        </div>

        {/* Budget Tracker */}
        <div className="mb-8">
          <BudgetTracker
            budget={budgetStats.budget}
            spent={budgetStats.spent}
            budgetType={budgetStats.budgetType}
            daysRemaining={budgetStats.daysRemaining}
          />
        </div>

        {/* Filters Toggle */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-full ${showFilters ? 'bg-green-50 border-green-300' : ''}`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </Button>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              onClick={() => setFilters({ cuisines: [], diets: [], maxCost: null, maxTime: null })}
              className="text-gray-500"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <RecipeFilters
                filters={filters}
                onChange={setFilters}
                onClear={() => setFilters({ cuisines: [], diets: [], maxCost: null, maxTime: null })}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* For You Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-bold text-gray-800">For You</h2>
            {profileData?.cuisines?.length > 0 && (
              <span className="text-sm text-gray-500 ml-2">
                Based on your {profileData.cuisines.slice(0, 2).join(', ')} preferences
              </span>
            )}
          </div>
          
          {recipesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-100 rounded-3xl h-80 animate-pulse" />
              ))}
            </div>
          ) : personalizedRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {personalizedRecipes.slice(0, 6).map((recipe, index) => (
                  <motion.div
                    key={recipe.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <RecipeCard
                      recipe={recipe}
                      householdSize={profileData?.household_size || 4}
                      pantryItems={profileData?.pantry_items}
                      isSaved={savedRecipes.some(sr => sr.recipe_id === recipe.id)}
                      onSave={() => saveRecipeMutation.mutate(recipe)}
                      onClick={() => navigate(createPageUrl('RecipeDetails') + `?id=${recipe.id}`)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No matching recipes</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or add new recipes</p>
              <Link to={createPageUrl('AddRecipe')}>
                <Button className="rounded-full bg-green-500 hover:bg-green-600">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Recipe
                </Button>
              </Link>
            </div>
          )}
        </section>

        {/* Explore New Recipes Section */}
        {exploreRecipes.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Compass className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-bold text-gray-800">Explore New Cuisines</h2>
              <span className="text-sm text-gray-500 ml-2">
                Try something different!
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exploreRecipes.slice(0, 3).map((recipe, index) => (
                <motion.div
                  key={recipe.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <RecipeCard
                    recipe={recipe}
                    householdSize={profileData?.household_size || 4}
                    pantryItems={profileData?.pantry_items}
                    isSaved={savedRecipes.some(sr => sr.recipe_id === recipe.id)}
                    onSave={() => saveRecipeMutation.mutate(recipe)}
                    onClick={() => navigate(createPageUrl('RecipeDetails') + `?id=${recipe.id}`)}
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* All Recipes */}
        {filteredRecipes.length > 6 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <ChefHat className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-800">All Recipes</h2>
              <span className="text-sm text-gray-500 ml-2">
                {filteredRecipes.length} recipes
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.slice(6).map((recipe, index) => (
                <motion.div
                  key={recipe.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <RecipeCard
                    recipe={recipe}
                    householdSize={profileData?.household_size || 4}
                    pantryItems={profileData?.pantry_items}
                    isSaved={savedRecipes.some(sr => sr.recipe_id === recipe.id)}
                    onSave={() => saveRecipeMutation.mutate(recipe)}
                    onClick={() => navigate(createPageUrl('RecipeDetails') + `?id=${recipe.id}`)}
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
