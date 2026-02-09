import React, { useState, useEffect } from 'react';
import { auth, entities } from '@/services';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, User, MapPin, Utensils, Salad, DollarSign, Package, Bell, Save, LogOut, Shield, Store, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import PillSelector from '@/components/onboarding/PillSelector';
import InstacartStoreSelector, { KROGER_FAMILY_RETAILERS } from '@/components/stores/InstacartStoreSelector';
import KrogerLocationSelector from '@/components/stores/KrogerLocationSelector';

const stores = [
  'Walmart', 'Kroger', 'Whole Foods', 'Trader Joe\'s', 'Costco',
  'Safeway', 'Publix', 'Aldi', 'Target', 'HEB', 'Wegmans', 'Sprouts'
];

const cuisines = [
  { value: 'Italian', icon: '🍝' }, { value: 'Mexican', icon: '🌮' },
  { value: 'Indian', icon: '🍛' }, { value: 'Chinese', icon: '🥡' },
  { value: 'American', icon: '🍔' }, { value: 'Mediterranean', icon: '🥙' },
  { value: 'Japanese', icon: '🍣' }, { value: 'Thai', icon: '🍜' },
  { value: 'French', icon: '🥐' }, { value: 'Korean', icon: '🍲' },
  { value: 'Vietnamese', icon: '🍜' }, { value: 'Greek', icon: '🥗' },
  { value: 'Spanish', icon: '🥘' }, { value: 'Middle Eastern', icon: '🧆' },
  { value: 'Brazilian', icon: '🥩' }
];

const diets = [
  { value: 'Vegetarian', icon: '🥬' }, { value: 'Vegan', icon: '🌱' },
  { value: 'Keto', icon: '🥑' }, { value: 'Paleo', icon: '🦴' },
  { value: 'Pescatarian', icon: '🐟' }, { value: 'Gluten-Free', icon: '🌾' },
  { value: 'Dairy-Free', icon: '🥛' }, { value: 'Carnivore', icon: '🥩' },
  { value: 'Low-Carb', icon: '🍞' }, { value: 'Halal', icon: '☪️' },
  { value: 'Kosher', icon: '✡️' }
];

const pantryItems = {
  basics: ['Olive Oil', 'Salt', 'Pepper', 'Sugar', 'Flour', 'Rice', 'Pasta', 'Butter'],
  spices: ['Garlic', 'Onions', 'Cumin', 'Paprika', 'Oregano', 'Basil', 'Cinnamon', 'Chili Powder'],
  tools: ['Pots', 'Pans', 'Blender', 'Mixer', 'Air Fryer', 'Instant Pot', 'Oven', 'Grill']
};

export default function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formData, setFormData] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [isStoreDialogOpen, setIsStoreDialogOpen] = useState(false);
  const [showKrogerLocations, setShowKrogerLocations] = useState(false);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const user = await auth.me();
      const profiles = await entities.UserProfile.filter({ user_id: user.id });
      return profiles[0];
    }
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => auth.me()
  });

  useEffect(() => {
    if (profileData) {
      setFormData(profileData);
      setProfileId(profileData.id);
      // Check if current store is a Kroger-family store
      if (profileData.preferred_retailer_key) {
        const isKroger = KROGER_FAMILY_RETAILERS.includes(
          profileData.preferred_retailer_key.toLowerCase()
        );
        setShowKrogerLocations(isKroger);
      }
    }
  }, [profileData]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      // Update in localStorage for demo mode
      localStorage.setItem('dishdollar_profile', JSON.stringify(formData));
      return entities.UserProfile.update(profileId, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast({
        title: "Profile Updated!",
        description: "Your preferences have been saved"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('dishdollar_profile');
      localStorage.removeItem('dishdollar_auth');
      await auth.logout(window.location.origin);
    }
  };

  if (isLoading || !formData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <User className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50">
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate(createPageUrl('Home'))}
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/20 hover:bg-white/30 text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-4xl font-bold flex items-center gap-3">
                  <User className="w-10 h-10" />
                  My Profile
                </h1>
                <p className="text-purple-100 mt-2">
                  {currentUser?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate(createPageUrl('Admin'))}
                variant="ghost"
                className="rounded-full bg-white/20 hover:bg-white/30 text-white"
              >
                <Shield className="w-5 h-5 mr-2" />
                Admin
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="rounded-full bg-white/20 hover:bg-white/30 text-white"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Your Name</Label>
                <Input
                  type="text"
                  value={formData.full_name || ''}
                  onChange={(e) => updateForm('full_name', e.target.value)}
                  placeholder="What should we call you?"
                  className="mt-1 rounded-xl border-2"
                />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={formData.date_of_birth || ''}
                  onChange={(e) => updateForm('date_of_birth', e.target.value)}
                  className="mt-1 rounded-xl border-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Location & Store
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>City</Label>
                  <Input
                    value={formData.location?.city || ''}
                    onChange={(e) => updateForm('location', { ...formData.location, city: e.target.value })}
                    className="mt-1 rounded-xl border-2"
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={formData.location?.state || ''}
                    onChange={(e) => updateForm('location', { ...formData.location, state: e.target.value })}
                    className="mt-1 rounded-xl border-2"
                  />
                </div>
              </div>
              <div>
                <Label>ZIP Code</Label>
                <Input
                  value={formData.location?.zip_code || ''}
                  onChange={(e) => updateForm('location', { ...formData.location, zip_code: e.target.value })}
                  className="mt-1 rounded-xl border-2"
                />
              </div>
              <div>
                <Label>Preferred Store for Instacart</Label>
                <button
                  onClick={() => setIsStoreDialogOpen(true)}
                  className="w-full mt-2 p-4 rounded-xl border-2 border-gray-200 hover:border-green-400 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Store className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">
                        {formData.preferred_store || 'No store selected'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formData.kroger_location_id
                          ? 'Specific store selected for pricing'
                          : 'Tap to change your preferred store'}
                      </p>
                      {formData.preferred_retailer_key && (
                        <p className="text-xs text-green-600 mt-0.5">
                          Instacart delivery available
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
                </button>

                {/* Store Selection Dialog */}
                <Dialog open={isStoreDialogOpen} onOpenChange={setIsStoreDialogOpen}>
                  <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Store className="w-5 h-5 text-green-600" />
                        Select Your Store
                      </DialogTitle>
                      <DialogDescription>
                        Choose your preferred grocery store for Instacart delivery.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 space-y-4">
                      <InstacartStoreSelector
                        zipCode={formData.location?.zip_code}
                        selectedStore={formData.preferred_store}
                        selectedRetailerKey={formData.preferred_retailer_key}
                        fallbackStores={stores}
                        onStoreSelect={(retailer) => {
                          updateForm('preferred_store', retailer.name);
                          updateForm('preferred_retailer_key', retailer.retailer_key);

                          // Show Kroger location selector if it's a Kroger-family store
                          if (retailer.isKrogerFamily) {
                            setShowKrogerLocations(true);
                          } else {
                            setShowKrogerLocations(false);
                            updateForm('kroger_location_id', '');
                            setIsStoreDialogOpen(false);
                            toast({
                              title: 'Store Updated',
                              description: `Your preferred store is now ${retailer.name}`
                            });
                          }
                        }}
                      />

                      {/* Kroger Location Selector */}
                      {showKrogerLocations && formData.preferred_store && (
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                          <KrogerLocationSelector
                            zipCode={formData.location?.zip_code}
                            storeName={formData.preferred_store}
                            selectedLocationId={formData.kroger_location_id}
                            onLocationSelect={(location) => {
                              if (location) {
                                updateForm('kroger_location_id', location.locationId);
                              } else {
                                updateForm('kroger_location_id', '');
                              }
                              setIsStoreDialogOpen(false);
                              toast({
                                title: 'Store Updated',
                                description: location
                                  ? `Your store is now ${location.name}`
                                  : `Your preferred store is now ${formData.preferred_store}`
                              });
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-600" />
                Favorite Cuisines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PillSelector
                options={cuisines.map(c => ({ value: c.value, label: `${c.icon} ${c.value}` }))}
                selected={formData.cuisines || []}
                onChange={(value) => updateForm('cuisines', value)}
                columns={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Salad className="w-5 h-5 text-green-600" />
                Dietary Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PillSelector
                options={diets.map(d => ({ value: d.value, label: `${d.icon} ${d.value}` }))}
                selected={formData.dietary_restrictions || []}
                onChange={(value) => updateForm('dietary_restrictions', value)}
                columns={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Household & Budget
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Household Size</Label>
                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={() => updateForm('household_size', Math.max(1, formData.household_size - 1))}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-xl font-semibold"
                  >
                    -
                  </button>
                  <span className="text-3xl font-bold text-green-600 w-12 text-center">
                    {formData.household_size}
                  </span>
                  <button
                    onClick={() => updateForm('household_size', formData.household_size + 1)}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-xl font-semibold"
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
                      onClick={() => updateForm('budget_type', type)}
                      className={`flex-1 py-2 rounded-xl font-medium capitalize transition-all border-2
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
                    value={formData.budget_days || 7}
                    onChange={(e) => updateForm('budget_days', parseInt(e.target.value) || 7)}
                    className="mt-1 rounded-xl border-2"
                    min={1}
                  />
                </div>
              )}
              <div>
                <Label>Budget Amount ($)</Label>
                <Input
                  type="number"
                  value={formData.budget_amount || 0}
                  onChange={(e) => updateForm('budget_amount', parseFloat(e.target.value) || 0)}
                  className="mt-1 rounded-xl border-2 text-xl font-bold text-green-600 h-12"
                  min={0}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                Pantry Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(pantryItems).map(([category, items]) => (
                <div key={category}>
                  <Label className="capitalize text-sm text-gray-600">{category}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {items.map((item) => (
                      <button
                        key={item}
                        onClick={() => {
                          const newItems = formData.pantry_items?.includes(item)
                            ? formData.pantry_items.filter(i => i !== item)
                            : [...(formData.pantry_items || []), item];
                          updateForm('pantry_items', newItems);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all border
                          ${formData.pantry_items?.includes(item)
                            ? 'bg-green-500 text-white border-green-500'
                            : 'bg-white border-gray-200 hover:border-green-300'}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-pink-600" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <button
                onClick={() => updateForm('notifications_enabled', !formData.notifications_enabled)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left
                  ${formData.notifications_enabled
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">Recipe Suggestions & Alerts</p>
                    <p className="text-sm text-gray-500">Get notified about new recipes and budget updates</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-all ${formData.notifications_enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${formData.notifications_enabled ? 'ml-6' : 'ml-1'}`} />
                  </div>
                </div>
              </button>
            </CardContent>
          </Card>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => updateProfileMutation.mutate()}
              disabled={updateProfileMutation.isPending}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-lg font-semibold"
            >
              {updateProfileMutation.isPending ? (
                'Saving...'
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
