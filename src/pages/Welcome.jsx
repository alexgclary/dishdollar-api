import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { auth, entities } from '@/services';
import { useQuery } from '@tanstack/react-query';
import { ChefHat, Leaf, DollarSign, Heart, ArrowRight, Sparkles, Calendar, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FloatingVegetables, WavyBackground } from '@/components/ui/DecorativeElements';

export default function Welcome() {
  const navigate = useNavigate();

  // Check if user has a profile (already onboarded)
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      try {
        // Check localStorage first for demo mode
        const localProfile = localStorage.getItem('dishdollar_profile');
        if (localProfile) {
          return JSON.parse(localProfile);
        }

        const user = await auth.me();
        if (user) {
          const profiles = await entities.UserProfile.filter({ user_id: user.id });
          return profiles[0];
        }
        return null;
      } catch {
        return null;
      }
    },
    retry: false
  });

  // Redirect authenticated users with completed onboarding
  useEffect(() => {
    if (!isLoading && profileData?.onboarding_completed) {
      navigate(createPageUrl('Home'));
    }
  }, [isLoading, profileData, navigate]);

  const features = [
    { 
      icon: ChefHat, 
      title: 'Discover Recipes', 
      description: 'Find delicious meals tailored to your taste',
      color: 'bg-amber-100 text-amber-600'
    },
    { 
      icon: DollarSign, 
      title: 'Track Budget', 
      description: 'Stay on top of your grocery spending',
      color: 'bg-green-100 text-green-600'
    },
    { 
      icon: Calendar, 
      title: 'Meal Planning', 
      description: 'Plan your weekly meals in advance',
      color: 'bg-indigo-100 text-indigo-600'
    },
    { 
      icon: ShoppingCart, 
      title: 'Smart Shopping', 
      description: 'Auto-generate shopping lists',
      color: 'bg-teal-100 text-teal-600'
    },
    { 
      icon: Leaf, 
      title: 'Dietary Filters', 
      description: 'Vegetarian, vegan, keto & more',
      color: 'bg-emerald-100 text-emerald-600'
    },
    { 
      icon: Heart, 
      title: 'Save Favorites', 
      description: 'Build your recipe collection',
      color: 'bg-red-100 text-red-500'
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50 relative overflow-hidden">
      <FloatingVegetables />
      <WavyBackground />
      
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center shadow-xl shadow-green-200">
                <ChefHat className="w-10 h-10 text-white" />
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                DishDollar
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Discover delicious recipes that fit your budget and dietary preferences 🥗
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link to={createPageUrl('Login')}>
                <Button size="lg" className="rounded-full px-8 py-6 text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-200">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to={createPageUrl('Login')}>
                <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-lg border-2 border-green-500 text-green-600 hover:bg-green-50">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-16">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100"
              >
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* How it Works */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100"
          >
            <div className="flex items-center justify-center gap-2 mb-8">
              <Sparkles className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">How it Works</h2>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-green-600">1</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Set Preferences</h3>
                <p className="text-gray-500 text-sm">
                  Cuisines, dietary needs & budget
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-amber-600">2</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Discover Recipes</h3>
                <p className="text-gray-500 text-sm">
                  Browse personalized suggestions
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-indigo-600">3</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Plan Meals</h3>
                <p className="text-gray-500 text-sm">
                  Schedule your weekly menu
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-teal-600">4</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Shop Smart</h3>
                <p className="text-gray-500 text-sm">
                  Get your auto-generated list
                </p>
              </div>
            </div>
          </motion.div>

          {/* Testimonial/Value Prop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 p-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl text-white"
          >
            <h3 className="text-2xl font-bold mb-2">Save Money. Eat Better. Plan Smarter.</h3>
            <p className="text-green-100 mb-6">
              Join thousands of home cooks who save an average of $200/month on groceries
            </p>
            <Link to={createPageUrl('Onboarding')}>
              <Button size="lg" className="rounded-full px-8 bg-white text-green-600 hover:bg-green-50">
                Start Saving Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="text-center py-8 text-gray-500 text-sm">
          <p>Made with 💚 for budget-conscious home cooks</p>
        </footer>
      </div>
    </div>
  );
}
