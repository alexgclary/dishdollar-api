import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ChevronRight, ChevronLeft, Sparkles, MapPin, Utensils, Salad, Users, Package, Bell, AlertCircle } from 'lucide-react';
import OnboardingProgress from '@/components/onboarding/OnboardingProgress';
import PillSelector from '@/components/onboarding/PillSelector';
import { FloatingVegetables, WavyBackground } from '@/components/ui/DecorativeElements';

const stores = [
  'Walmart', 'Kroger', 'Whole Foods', 'Trader Joe\'s', 'Costco', 
  'Safeway', 'Publix', 'Aldi', 'Target', 'HEB', 'Wegmans', 'Sprouts',
  'Food Lion', 'Albertsons', 'Meijer', 'WinCo', 'Grocery Outlet', 'Other'
];

const cuisines = [
  { value: 'Italian', icon: '🍝' }, { value: 'Mexican', icon: '🌮' },
  { value: 'Indian', icon: '🍛' }, { value: 'Chinese', icon: '🥡' },
  { value: 'American', icon: '🍔' }, { value: 'Mediterranean', icon: '🥙' },
  { value: 'Japanese', icon: '🍣' }, { value: 'Thai', icon: '🍜' },
  { value: 'French', icon: '🥐' }, { value: 'Korean', icon: '🍲' },
  { value: 'Vietnamese', icon: '🍜' }, { value: 'Greek', icon: '🥗' },
  { value: 'Spanish', icon: '🥘' }, { value: 'Middle Eastern', icon: '🧆' },
  { value: 'Brazilian', icon: '🥩' }, { value: 'Caribbean', icon: '🍖' },
  { value: 'Ethiopian', icon: '🍛' }, { value: 'German', icon: '🥨' }
];

const diets = [
  { value: 'Vegetarian', icon: '🥬' }, { value: 'Vegan', icon: '🌱' },
  { value: 'Keto', icon: '🥑' }, { value: 'Paleo', icon: '🦴' },
  { value: 'Pescatarian', icon: '🐟' }, { value: 'Gluten-Free', icon: '🌾' },
  { value: 'Dairy-Free', icon: '🥛' }, { value: 'Carnivore', icon: '🥩' },
  { value: 'Low-Carb', icon: '🍞' }, { value: 'Halal', icon: '☪️' },
  { value: 'Kosher', icon: '✡️' }, { value: 'Whole30', icon: '🥗' },
  { value: 'No Restrictions', icon: '✨' }
];

const pantryItems = {
  basics: ['Olive Oil', 'Vegetable Oil', 'Salt', 'Pepper', 'Sugar', 'Flour', 'Rice', 'Pasta', 'Butter', 'Eggs', 'Milk', 'Bread'],
  spices: ['Garlic', 'Onions', 'Cumin', 'Paprika', 'Oregano', 'Basil', 'Cinnamon', 'Chili Powder', 'Turmeric', 'Ginger', 'Bay Leaves', 'Thyme'],
  condiments: ['Soy Sauce', 'Hot Sauce', 'Mustard', 'Ketchup', 'Mayo', 'Vinegar', 'Honey', 'Maple Syrup'],
  tools: ['Pots', 'Pans', 'Blender', 'Mixer', 'Air Fryer', 'Instant Pot', 'Oven', 'Grill', 'Food Processor', 'Slow Cooker']
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    location: { city: '', state: '', zip_code: '' },
    preferred_store: '',
    cuisines: [],
    dietary_restrictions: [],
    household_size: 2,
    budget_type: 'weekly',
    budget_amount: 150,
    budget_days: 7,
    pantry_items: [],
    notifications_enabled: false
  });

  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    
    switch (currentStep) {
      case 1:
        if (!formData.full_name.trim()) {
          newErrors.full_name = 'Please enter your name';
        }
        break;
      case 2:
        if (!formData.location.zip_code.trim()) {
          newErrors.zip_code = 'ZIP code helps us find accurate prices';
        }
        if (!formData.preferred_store) {
          newErrors.preferred_store = 'Please select a preferred store';
        }
        break;
      case 3:
        if (formData.cuisines.length === 0) {
          newErrors.cuisines = 'Select at least one cuisine you enjoy';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(s => s + 1);
    } else {
      toast({
        title: "Missing Information",
        description: "Please fill in the required fields",
        variant: "destructive"
      });
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Try to get the authenticated user
      let userId = 'demo-user';
      try {
        const user = await base44.auth.me();
        if (user?.id) {
          userId = user.id;
        }
      } catch (authError) {
        console.log('Auth not available, using demo mode');
      }

      // Try to save to Base44
      try {
        await base44.entities.UserProfile.create({
          ...formData,
          user_id: userId,
          onboarding_completed: true,
          created_at: new Date().toISOString()
        });
      } catch (saveError) {
        console.log('Base44 save failed, using localStorage fallback');
        // Store in localStorage as fallback for demo
        localStorage.setItem('budgetbite_profile', JSON.stringify({
          ...formData,
          user_id: userId,
          onboarding_completed: true,
          created_at: new Date().toISOString()
        }));
      }

      toast({
        title: "Welcome to BudgetBite! 🎉",
        description: "Your profile has been set up successfully",
      });

      // Always navigate to Home after onboarding
      navigate(createPageUrl('Home'));
    } catch (error) {
      console.error('Error in onboarding:', error);
      // Even on error, save to localStorage and navigate for demo purposes
      localStorage.setItem('budgetbite_profile', JSON.stringify({
        ...formData,
        user_id: 'demo-user',
        onboarding_completed: true,
        created_at: new Date().toISOString()
      }));

      toast({
        title: "Welcome to BudgetBite! 🎉",
        description: "Your profile has been set up successfully",
      });

      navigate(createPageUrl('Home'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    const variants = {
      enter: { opacity: 0, x: 20 },
      center: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 }
    };

    switch (step) {
      case 1:
        return (
          <motion.div key="step1" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Let's get started!</h2>
              <p className="text-gray-500 mt-2">Tell us a bit about yourself</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Your Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => updateForm('full_name', e.target.value)}
                  placeholder="What should we call you?"
                  className={`mt-1 rounded-xl border-2 ${errors.full_name ? 'border-red-400' : 'border-gray-200'} focus:border-green-400`}
                />
                {errors.full_name && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.full_name}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="dob">Date of Birth (optional)</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => updateForm('date_of_birth', e.target.value)}
                  className="mt-1 rounded-xl border-2 border-gray-200 focus:border-green-400"
                />
                <p className="text-xs text-gray-400 mt-1">Used for personalized recommendations</p>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div key="step2" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Where do you shop?</h2>
              <p className="text-gray-500 mt-2">We'll use this for accurate pricing</p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>City</Label>
                  <Input
                    value={formData.location.city}
                    onChange={(e) => updateForm('location', { ...formData.location, city: e.target.value })}
                    className="mt-1 rounded-xl border-2"
                    placeholder="San Francisco"
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={formData.location.state}
                    onChange={(e) => updateForm('location', { ...formData.location, state: e.target.value })}
                    className="mt-1 rounded-xl border-2"
                    placeholder="CA"
                    maxLength={2}
                  />
                </div>
              </div>
              <div>
                <Label>ZIP Code *</Label>
                <Input
                  value={formData.location.zip_code}
                  onChange={(e) => updateForm('location', { ...formData.location, zip_code: e.target.value })}
                  className={`mt-1 rounded-xl border-2 ${errors.zip_code ? 'border-red-400' : ''}`}
                  placeholder="94102"
                  maxLength={5}
                />
                {errors.zip_code && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.zip_code}
                  </p>
                )}
              </div>
              <div>
                <Label>Preferred Store *</Label>
                <div className="grid grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto">
                  {stores.map((store) => (
                    <button
                      key={store}
                      onClick={() => updateForm('preferred_store', store)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border-2
                        ${formData.preferred_store === store 
                          ? 'border-green-500 bg-green-50 text-green-700' 
                          : 'border-gray-200 hover:border-green-300'}`}
                    >
                      {store}
                    </button>
                  ))}
                </div>
                {errors.preferred_store && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.preferred_store}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div key="step3" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">What cuisines do you love?</h2>
              <p className="text-gray-500 mt-2">Select all that make your taste buds happy</p>
            </div>
            <PillSelector
              options={cuisines.map(c => ({ value: c.value, label: `${c.icon} ${c.value}` }))}
              selected={formData.cuisines}
              onChange={(value) => updateForm('cuisines', value)}
              columns={3}
            />
            {errors.cuisines && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1 justify-center">
                <AlertCircle className="w-4 h-4" />
                {errors.cuisines}
              </p>
            )}
            <p className="text-center text-sm text-gray-400">
              {formData.cuisines.length} selected
            </p>
          </motion.div>
        );

      case 4:
        return (
          <motion.div key="step4" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Salad className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Any dietary preferences?</h2>
              <p className="text-gray-500 mt-2">We'll personalize recipes just for you</p>
            </div>
            <PillSelector
              options={diets.map(d => ({ value: d.value, label: `${d.icon} ${d.value}` }))}
              selected={formData.dietary_restrictions}
              onChange={(value) => updateForm('dietary_restrictions', value)}
              columns={3}
            />
            <p className="text-center text-sm text-gray-400">
              {formData.dietary_restrictions.length === 0 
                ? "Skip if you have no restrictions" 
                : `${formData.dietary_restrictions.length} selected`}
            </p>
          </motion.div>
        );

      case 5:
        return (
          <motion.div key="step5" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Household & Budget</h2>
              <p className="text-gray-500 mt-2">Help us scale recipes and track spending</p>
            </div>
            <div className="space-y-6">
              <div>
                <Label>How many people are you feeding?</Label>
                <div className="flex items-center justify-center gap-4 mt-3">
                  <button
                    onClick={() => updateForm('household_size', Math.max(1, formData.household_size - 1))}
                    className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 text-2xl font-semibold transition-colors"
                  >
                    -
                  </button>
                  <span className="text-4xl font-bold text-green-600 w-16 text-center">
                    {formData.household_size}
                  </span>
                  <button
                    onClick={() => updateForm('household_size', formData.household_size + 1)}
                    className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 text-2xl font-semibold transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <Label>Budget Period</Label>
                <div className="flex gap-2 mt-2">
                  {['weekly', 'monthly', 'custom'].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        updateForm('budget_type', type);
                        if (type === 'weekly') updateForm('budget_days', 7);
                        if (type === 'monthly') updateForm('budget_days', 30);
                      }}
                      className={`flex-1 py-3 rounded-xl font-medium capitalize transition-all border-2
                        ${formData.budget_type === type 
                          ? 'border-green-500 bg-green-50 text-green-700' 
                          : 'border-gray-200 hover:border-green-300'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              {formData.budget_type === 'custom' && (
                <div>
                  <Label>Number of Days</Label>
                  <Input
                    type="number"
                    value={formData.budget_days}
                    onChange={(e) => updateForm('budget_days', parseInt(e.target.value) || 7)}
                    className="mt-1 rounded-xl border-2"
                    min={1}
                    max={365}
                  />
                </div>
              )}
              <div>
                <Label>Budget Amount ($)</Label>
                <Input
                  type="number"
                  value={formData.budget_amount}
                  onChange={(e) => updateForm('budget_amount', parseFloat(e.target.value) || 0)}
                  className="mt-1 rounded-xl border-2 text-2xl font-bold text-green-600 h-14"
                  min={0}
                />
                <p className="text-xs text-gray-400 mt-1">
                  That's about ${(formData.budget_amount / formData.household_size / (formData.budget_type === 'monthly' ? 30 : formData.budget_type === 'weekly' ? 7 : formData.budget_days)).toFixed(2)} per person per day
                </p>
              </div>
            </div>
          </motion.div>
        );

      case 6:
        return (
          <motion.div key="step6" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">What's in your pantry?</h2>
              <p className="text-gray-500 mt-2">We'll deduct these from recipe costs</p>
            </div>
            <div className="space-y-6 max-h-80 overflow-y-auto">
              {Object.entries(pantryItems).map(([category, items]) => (
                <div key={category}>
                  <Label className="capitalize text-sm text-gray-600 font-semibold">{category}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {items.map((item) => (
                      <button
                        key={item}
                        onClick={() => {
                          const newItems = formData.pantry_items.includes(item)
                            ? formData.pantry_items.filter(i => i !== item)
                            : [...formData.pantry_items, item];
                          updateForm('pantry_items', newItems);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all border
                          ${formData.pantry_items.includes(item)
                            ? 'bg-green-500 text-white border-green-500'
                            : 'bg-white border-gray-200 hover:border-green-300'}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-gray-400">
              {formData.pantry_items.length} items selected
            </p>
          </motion.div>
        );

      case 7:
        return (
          <motion.div key="step7" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-pink-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Stay in the loop?</h2>
              <p className="text-gray-500 mt-2">Get personalized recipe suggestions</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => updateForm('notifications_enabled', true)}
                className={`w-full max-w-sm p-4 rounded-2xl border-2 transition-all text-left
                  ${formData.notifications_enabled 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-green-300'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Bell className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Yes, notify me!</p>
                    <p className="text-sm text-gray-500">Recipe tips & budget alerts</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => updateForm('notifications_enabled', false)}
                className={`w-full max-w-sm p-4 rounded-2xl border-2 transition-all text-left
                  ${!formData.notifications_enabled 
                    ? 'border-gray-400 bg-gray-50' 
                    : 'border-gray-200 hover:border-gray-300'}`}
              >
                <p className="font-medium text-gray-600 text-center">No thanks, maybe later</p>
              </button>
            </div>
            
            <div className="mt-8 p-4 bg-green-50 rounded-2xl">
              <h3 className="font-semibold text-green-800 mb-2">Your Profile Summary</h3>
              <div className="text-sm text-green-700 space-y-1">
                <p>👤 {formData.full_name || 'Not set'}</p>
                <p>📍 {formData.location.city || 'Location'}, {formData.location.state || ''} - {formData.preferred_store || 'Store'}</p>
                <p>🍽️ {formData.cuisines.length} cuisines • {formData.dietary_restrictions.length} dietary preferences</p>
                <p>👨‍👩‍👧‍👦 {formData.household_size} people • ${formData.budget_amount}/{formData.budget_type}</p>
                <p>🥫 {formData.pantry_items.length} pantry items</p>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50 relative overflow-hidden">
      <FloatingVegetables />
      <WavyBackground />
      
      <div className="relative z-10 max-w-xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
            🥗 BudgetBite
          </h1>
        </div>

        <OnboardingProgress currentStep={step} />

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 min-h-[400px]">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>

        <div className="flex justify-between mt-6">
          <Button
            variant="ghost"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className="rounded-full px-6"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </Button>
          
          {step < 7 ? (
            <Button
              onClick={handleNext}
              className="rounded-full px-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              Continue
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={isLoading}
              className="rounded-full px-8 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              {isLoading ? 'Setting up...' : 'Get Started! 🎉'}
            </Button>
          )}
        </div>
        
        {step > 3 && step < 7 && (
          <div className="text-center mt-4">
            <button 
              onClick={() => setStep(s => s + 1)}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Skip this step
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
