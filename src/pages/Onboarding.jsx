import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, entities } from '@/services';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronRight, ChevronLeft, Sparkles, MapPin, Utensils, Salad, Users, Package, Bell, AlertCircle, Loader2, Navigation, Store, Check } from 'lucide-react';
import OnboardingProgress from '@/components/onboarding/OnboardingProgress';
import PillSelector from '@/components/onboarding/PillSelector';
import SearchablePillSelector from '@/components/onboarding/SearchablePillSelector';
import AppIntroModal from '@/components/onboarding/AppIntroModal';
import { FloatingVegetables, WavyBackground } from '@/components/ui/DecorativeElements';
import { US_STATES } from '@/utils/usStates';
import InstacartStoreSelector from '@/components/stores/InstacartStoreSelector';

// Store data with regions for smarter recommendations
const storeData = [
  { name: 'Walmart', nationwide: true },
  { name: 'Kroger', regions: ['midwest', 'south', 'west'] },
  { name: 'Whole Foods', nationwide: true },
  { name: "Trader Joe's", nationwide: true },
  { name: 'Costco', nationwide: true },
  { name: 'Safeway', regions: ['west', 'mid-atlantic'] },
  { name: 'Publix', regions: ['southeast'] },
  { name: 'Aldi', regions: ['midwest', 'east', 'south'] },
  { name: 'Target', nationwide: true },
  { name: 'HEB', regions: ['texas'] },
  { name: 'Wegmans', regions: ['northeast', 'mid-atlantic'] },
  { name: 'Sprouts', regions: ['west', 'south', 'midwest'] },
  { name: 'Food Lion', regions: ['southeast', 'mid-atlantic'] },
  { name: 'Albertsons', regions: ['west'] },
  { name: 'Meijer', regions: ['midwest'] },
  { name: 'WinCo', regions: ['west'] },
  { name: 'Grocery Outlet', regions: ['west'] },
  { name: 'Other', nationwide: true }
];

const stores = storeData.map(s => s.name);

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

// Extended cuisines for search
const extendedCuisines = [
  { value: 'Filipino', icon: '🍜' }, { value: 'Portuguese', icon: '🐟' },
  { value: 'Peruvian', icon: '🥔' }, { value: 'Turkish', icon: '🥙' },
  { value: 'Moroccan', icon: '🍲' }, { value: 'Polish', icon: '🥟' },
  { value: 'Russian', icon: '🍜' }, { value: 'Cuban', icon: '🍖' },
  { value: 'Jamaican', icon: '🌶️' }, { value: 'Hawaiian', icon: '🍍' },
  { value: 'Indonesian', icon: '🍛' }, { value: 'Malaysian', icon: '🍜' },
  { value: 'Lebanese', icon: '🧆' }, { value: 'Israeli', icon: '🥙' },
  { value: 'Argentinian', icon: '🥩' }, { value: 'Colombian', icon: '🫓' },
  { value: 'Soul Food', icon: '🍗' }, { value: 'Cajun', icon: '🦐' },
  { value: 'Tex-Mex', icon: '🌯' }, { value: 'British', icon: '🍟' },
  { value: 'Irish', icon: '🥘' }, { value: 'Swedish', icon: '🧆' },
  { value: 'Nigerian', icon: '🍲' }, { value: 'Ghanaian', icon: '🍛' }
];

// Common allergies (FDA Top 9 + common ones)
const allergies = [
  { value: 'Peanuts', icon: '🥜' },
  { value: 'Tree Nuts', icon: '🌰' },
  { value: 'Dairy', icon: '🥛' },
  { value: 'Eggs', icon: '🥚' },
  { value: 'Wheat/Gluten', icon: '🌾' },
  { value: 'Soy', icon: '🫛' },
  { value: 'Fish', icon: '🐟' },
  { value: 'Shellfish', icon: '🦐' },
  { value: 'Sesame', icon: '🫘' }
];

// Extended allergies for search
const extendedAllergies = [
  { value: 'Mustard', icon: '🟡' },
  { value: 'Celery', icon: '🥬' },
  { value: 'Lupin', icon: '🌸' },
  { value: 'Mollusks', icon: '🦪' },
  { value: 'Sulfites', icon: '🍷' },
  { value: 'Corn', icon: '🌽' },
  { value: 'Latex (cross-reactive)', icon: '🍌' },
  { value: 'Red Meat', icon: '🥩' },
  { value: 'Nightshades', icon: '🍅' },
  { value: 'Coconut', icon: '🥥' },
  { value: 'Garlic', icon: '🧄' },
  { value: 'Onion', icon: '🧅' }
];

// Extended basics for search
const extendedBasics = [
  'Coconut Oil', 'Avocado Oil', 'Sesame Oil', 'Ghee', 'Lard',
  'Brown Sugar', 'Powdered Sugar', 'Whole Wheat Flour', 'Bread Flour', 'Almond Flour',
  'Cornstarch', 'Baking Soda', 'Baking Powder', 'Yeast', 'Oats',
  'Quinoa', 'Couscous', 'Brown Rice', 'Basmati Rice', 'Jasmine Rice',
  'Spaghetti', 'Penne', 'Linguine', 'Tortillas', 'Pita Bread'
];

// Extended spices for search
const extendedSpices = [
  'Rosemary', 'Sage', 'Nutmeg', 'Cloves', 'Cardamom', 'Cayenne',
  'Italian Seasoning', 'Taco Seasoning', 'Curry Powder', 'Smoked Paprika',
  'Red Pepper Flakes', 'Fennel Seeds', 'Coriander', 'Dill', 'Mint',
  'Tarragon', 'Chives', 'Lemongrass', 'Star Anise', 'Saffron',
  'Allspice', 'Mustard Seeds', 'Celery Salt', 'Onion Powder', 'Garlic Powder'
];

// Extended condiments for search
const extendedCondiments = [
  'Worcestershire Sauce', 'BBQ Sauce', 'Sriracha', 'Tahini', 'Fish Sauce',
  'Oyster Sauce', 'Hoisin Sauce', 'Teriyaki Sauce', 'Salsa', 'Pesto',
  'Ranch Dressing', 'Italian Dressing', 'Balsamic Vinegar', 'Rice Vinegar', 'Apple Cider Vinegar',
  'Dijon Mustard', 'Whole Grain Mustard', 'Relish', 'Pickles', 'Capers',
  'Olives', 'Sun-Dried Tomatoes', 'Anchovy Paste', 'Miso Paste', 'Chili Paste'
];

// Extended kitchen tools for search
const extendedTools = [
  'Sous Vide', 'Dutch Oven', 'Cast Iron Skillet', 'Wok', 'Mandoline',
  'Kitchen Scale', 'Thermometer', 'Rice Cooker', 'Pressure Cooker', 'Griddle',
  'Waffle Maker', 'Stand Mixer', 'Immersion Blender', 'Spiralizer', 'Juicer',
  'Dehydrator', 'Smoker', 'Pizza Stone', 'Bread Machine', 'Ice Cream Maker',
  'Toaster Oven', 'Convection Oven', 'Steamer', 'Deep Fryer', 'Popcorn Maker'
];

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLocating, setIsLocating] = useState(false);
  const [isLookingUpZip, setIsLookingUpZip] = useState(false);
  const [userCoordinates, setUserCoordinates] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    location: { city: '', state: '', zip_code: '' },
    preferred_store: '',
    cuisines: [],
    dietary_restrictions: [],
    allergies: [],
    household_size: 2,
    cooking_nights_per_week: 5,
    budget_type: 'weekly',
    budget_amount: 150,
    budget_days: 7,
    pantry_items: [],
    notifications_enabled: false
  });

  // Show app intro on first visit
  const [showIntro, setShowIntro] = useState(() => {
    return !localStorage.getItem('dishdollar_intro_seen');
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

  // Look up city/state from ZIP code using free API
  const lookupZipCode = async (zip) => {
    if (zip.length !== 5) return;
    setIsLookingUpZip(true);
    try {
      const response = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (response.ok) {
        const data = await response.json();
        if (data.places && data.places[0]) {
          const place = data.places[0];
          updateForm('location', {
            ...formData.location,
            city: place['place name'],
            state: place['state abbreviation'],
            zip_code: zip
          });
          toast({ title: "Location found!", description: `${place['place name']}, ${place['state abbreviation']}` });
        }
      }
    } catch (error) {
      console.error('ZIP lookup failed:', error);
    } finally {
      setIsLookingUpZip(false);
    }
  };

  // Get user's current location via browser geolocation
  const handleEnableLocation = async () => {
    if (!navigator.geolocation) {
      toast({ title: "Not supported", description: "Geolocation is not supported by your browser", variant: "destructive" });
      return;
    }

    setIsLocating(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const { latitude, longitude } = position.coords;
      setUserCoordinates({ lat: latitude, lng: longitude });

      // Reverse geocode using Nominatim (free, no API key)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        { headers: { 'User-Agent': 'DishDollar/1.0' } }
      );

      if (response.ok) {
        const data = await response.json();
        const address = data.address;

        // Extract city (try multiple fields)
        const city = address.city || address.town || address.village || address.suburb || '';
        const state = address.state || '';
        const zip = address.postcode || '';

        // Find state abbreviation
        const stateObj = US_STATES.find(s =>
          s.label.toLowerCase() === state.toLowerCase() ||
          s.value.toLowerCase() === state.toLowerCase()
        );
        const stateAbbrev = stateObj?.value || state.substring(0, 2).toUpperCase();

        updateForm('location', {
          city,
          state: stateAbbrev,
          zip_code: zip.substring(0, 5)
        });

        toast({ title: "Location detected!", description: `${city}, ${stateAbbrev}` });
      }
    } catch (error) {
      console.error('Geolocation error:', error);
      toast({
        title: "Location unavailable",
        description: error.code === 1 ? "Permission denied. Please enable location access." : "Could not determine your location.",
        variant: "destructive"
      });
    } finally {
      setIsLocating(false);
    }
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
      // Get the authenticated user
      const user = await auth.me();
      const userId = user?.id || 'demo-user';

      // Save profile to database (with localStorage fallback)
      const profileData = {
        ...formData,
        user_id: userId,
        onboarding_completed: true,
        created_at: new Date().toISOString()
      };

      await entities.UserProfile.create(profileData);

      // Also save to localStorage for immediate access
      localStorage.setItem('dishdollar_profile', JSON.stringify(profileData));

      // Invalidate and refetch the userProfile query so Home page gets fresh data
      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.setQueryData(['userProfile'], profileData);

      toast({
        title: "Welcome to DishDollar!",
        description: "Your profile has been set up successfully",
      });

      // Navigate to Home after onboarding
      navigate(createPageUrl('Home'), { replace: true });
    } catch (error) {
      console.error('Error in onboarding:', error);
      // Even on error, save to localStorage and navigate
      const fallbackProfile = {
        ...formData,
        user_id: 'demo-user',
        onboarding_completed: true,
        created_at: new Date().toISOString()
      };
      localStorage.setItem('dishdollar_profile', JSON.stringify(fallbackProfile));

      // Update query cache with fallback profile
      queryClient.setQueryData(['userProfile'], fallbackProfile);

      toast({
        title: "Welcome to DishDollar!",
        description: "Your profile has been set up successfully",
      });

      navigate(createPageUrl('Home'), { replace: true });
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
              {/* Geolocation Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleEnableLocation}
                disabled={isLocating}
                className="w-full rounded-xl border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Detecting location...
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 mr-2" />
                    Use My Location
                  </>
                )}
              </Button>

              <div className="relative flex items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-sm">or enter manually</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              {/* ZIP Code with auto-fill */}
              <div>
                <Label>ZIP Code *</Label>
                <div className="relative">
                  <Input
                    value={formData.location.zip_code}
                    onChange={(e) => {
                      const zip = e.target.value.replace(/\D/g, '').slice(0, 5);
                      updateForm('location', { ...formData.location, zip_code: zip });
                      if (zip.length === 5) {
                        lookupZipCode(zip);
                      }
                    }}
                    className={`mt-1 rounded-xl border-2 ${errors.zip_code ? 'border-red-400' : ''}`}
                    placeholder="Enter ZIP to auto-fill city & state"
                    maxLength={5}
                  />
                  {isLookingUpZip && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                  )}
                </div>
                {errors.zip_code && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.zip_code}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>City</Label>
                  <Input
                    value={formData.location.city}
                    onChange={(e) => updateForm('location', { ...formData.location, city: e.target.value })}
                    className="mt-1 rounded-xl border-2"
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Select
                    value={formData.location.state}
                    onValueChange={(value) => updateForm('location', { ...formData.location, state: value })}
                  >
                    <SelectTrigger className="mt-1 rounded-xl border-2">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {US_STATES.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.value} - {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  Preferred Store *
                </Label>
                <div className="mt-2">
                  <InstacartStoreSelector
                    zipCode={formData.location.zip_code}
                    onStoreSelect={(store) => updateForm('preferred_store', store)}
                    selectedStore={formData.preferred_store}
                    fallbackStores={stores}
                  />
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
            <SearchablePillSelector
              options={cuisines.map(c => ({ value: c.value, label: c.value, icon: c.icon }))}
              searchableOptions={extendedCuisines.map(c => ({ value: c.value, label: c.value, icon: c.icon }))}
              selected={formData.cuisines}
              onChange={(value) => updateForm('cuisines', value)}
              columns={3}
              placeholder="Search cuisines..."
              searchLabel="More Cuisines"
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
          <motion.div key="step4" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-6 max-h-[60vh] overflow-y-auto">
            <div className="text-center mb-6">
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

            {/* Allergy Section */}
            <div className="pt-6 border-t border-gray-200">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Any food allergies?</h3>
                <p className="text-gray-500 text-sm">We'll exclude recipes with these ingredients</p>
              </div>
              <SearchablePillSelector
                options={allergies.map(a => ({ value: a.value, label: a.value, icon: a.icon }))}
                searchableOptions={extendedAllergies.map(a => ({ value: a.value, label: a.value, icon: a.icon }))}
                selected={formData.allergies}
                onChange={(value) => updateForm('allergies', value)}
                columns={3}
                placeholder="Search allergies..."
                searchLabel="Other"
              />
              <p className="text-center text-sm text-gray-400 mt-2">
                {formData.allergies.length === 0
                  ? "Skip if you have no allergies"
                  : `${formData.allergies.length} allergy${formData.allergies.length !== 1 ? ' restrictions' : ''}`}
              </p>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div key="step5" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-6 max-h-[60vh] overflow-y-auto">
            <div className="text-center mb-6">
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

              {/* Cooking Nights Question */}
              <div className="pt-4 border-t border-gray-100">
                <Label>How many nights a week do you cook dinner?</Label>
                <div className="flex items-center justify-center gap-4 mt-3">
                  <button
                    onClick={() => updateForm('cooking_nights_per_week', Math.max(1, formData.cooking_nights_per_week - 1))}
                    className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 text-2xl font-semibold transition-colors"
                  >
                    -
                  </button>
                  <span className="text-4xl font-bold text-blue-600 w-16 text-center">
                    {formData.cooking_nights_per_week}
                  </span>
                  <button
                    onClick={() => updateForm('cooking_nights_per_week', Math.min(7, formData.cooking_nights_per_week + 1))}
                    className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 text-2xl font-semibold transition-colors"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-center">
                  We'll suggest ~{formData.cooking_nights_per_week * 4} recipes per month for your meal plans
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100">
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
        // Helper functions for each category
        const allBasicsOptions = [...pantryItems.basics, ...extendedBasics];
        const allSpicesOptions = [...pantryItems.spices, ...extendedSpices];
        const allCondimentsOptions = [...pantryItems.condiments, ...extendedCondiments];
        const allToolsOptions = [...pantryItems.tools, ...extendedTools];

        const getSelectedForCategory = (categoryOptions) =>
          formData.pantry_items.filter(item => categoryOptions.includes(item));

        const getSelectedOutsideCategory = (categoryOptions) =>
          formData.pantry_items.filter(item => !categoryOptions.includes(item));

        const handleCategoryChange = (categoryOptions, newItems) => {
          const outsideCategory = getSelectedOutsideCategory(categoryOptions);
          updateForm('pantry_items', [...outsideCategory, ...newItems]);
        };

        return (
          <motion.div key="step6" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">What's in your pantry?</h2>
              <p className="text-gray-500 mt-2">We'll deduct these from recipe costs</p>
            </div>
            <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-2">
              {/* Basics */}
              <div>
                <Label className="text-sm text-gray-600 font-semibold">Basics</Label>
                <div className="mt-2">
                  <SearchablePillSelector
                    options={pantryItems.basics.map(t => ({ value: t, label: t }))}
                    searchableOptions={extendedBasics.map(t => ({ value: t, label: t }))}
                    selected={getSelectedForCategory(allBasicsOptions)}
                    onChange={(newItems) => handleCategoryChange(allBasicsOptions, newItems)}
                    columns={3}
                    placeholder="Search basics..."
                    searchLabel="More"
                  />
                </div>
              </div>

              {/* Spices */}
              <div>
                <Label className="text-sm text-gray-600 font-semibold">Spices</Label>
                <div className="mt-2">
                  <SearchablePillSelector
                    options={pantryItems.spices.map(t => ({ value: t, label: t }))}
                    searchableOptions={extendedSpices.map(t => ({ value: t, label: t }))}
                    selected={getSelectedForCategory(allSpicesOptions)}
                    onChange={(newItems) => handleCategoryChange(allSpicesOptions, newItems)}
                    columns={3}
                    placeholder="Search spices..."
                    searchLabel="More"
                  />
                </div>
              </div>

              {/* Condiments */}
              <div>
                <Label className="text-sm text-gray-600 font-semibold">Condiments</Label>
                <div className="mt-2">
                  <SearchablePillSelector
                    options={pantryItems.condiments.map(t => ({ value: t, label: t }))}
                    searchableOptions={extendedCondiments.map(t => ({ value: t, label: t }))}
                    selected={getSelectedForCategory(allCondimentsOptions)}
                    onChange={(newItems) => handleCategoryChange(allCondimentsOptions, newItems)}
                    columns={3}
                    placeholder="Search condiments..."
                    searchLabel="More"
                  />
                </div>
              </div>

              {/* Kitchen Tools */}
              <div>
                <Label className="text-sm text-gray-600 font-semibold">Kitchen Tools</Label>
                <div className="mt-2">
                  <SearchablePillSelector
                    options={pantryItems.tools.map(t => ({ value: t, label: t }))}
                    searchableOptions={extendedTools.map(t => ({ value: t, label: t }))}
                    selected={getSelectedForCategory(allToolsOptions)}
                    onChange={(newItems) => handleCategoryChange(allToolsOptions, newItems)}
                    columns={3}
                    placeholder="Search tools..."
                    searchLabel="More"
                  />
                </div>
              </div>
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
      {/* App Intro Modal - shows on first visit */}
      <AppIntroModal
        open={showIntro}
        onClose={() => {
          localStorage.setItem('dishdollar_intro_seen', 'true');
          setShowIntro(false);
        }}
      />

      <FloatingVegetables />
      <WavyBackground />
      
      <div className="relative z-10 max-w-xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
            🍽️ DishDollar
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
