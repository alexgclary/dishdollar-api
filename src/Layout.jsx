import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Heart, Plus, TrendingUp, User, ChefHat, Calendar, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Layout({ children, currentPageName }) {
  const isOnboarding = currentPageName === 'Onboarding';
  const isWelcome = currentPageName === 'Welcome';
  
  const navItems = [
    { name: 'Home', icon: Home, page: 'Home' },
    { name: 'Plan', icon: Calendar, page: 'MealPlanner' },
    { name: 'Add', icon: Plus, page: 'AddRecipe', special: true },
    { name: 'Saved', icon: Heart, page: 'SavedRecipes' },
    { name: 'Budget', icon: TrendingUp, page: 'Budget' },
  ];

  const sidebarItems = [
    { name: 'Home', icon: Home, page: 'Home' },
    { name: 'Meal Planner', icon: Calendar, page: 'MealPlanner' },
    { name: 'Shopping List', icon: ShoppingCart, page: 'ShoppingList' },
    { name: 'Saved Recipes', icon: Heart, page: 'SavedRecipes' },
    { name: 'Budget', icon: TrendingUp, page: 'Budget' },
    { name: 'Profile', icon: User, page: 'Profile' },
  ];

  if (isOnboarding || isWelcome) {
    return children;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 md:hidden z-50 safe-area-bottom">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            const Icon = item.icon;
            
            if (item.special) {
              return (
                <Link key={item.page} to={createPageUrl(item.page)}>
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="w-14 h-14 -mt-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200"
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </motion.div>
                </Link>
              );
            }
            
            return (
              <Link key={item.page} to={createPageUrl(item.page)} className="flex-1">
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className={`flex flex-col items-center py-2 relative ${
                    isActive ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                  <span className="text-xs mt-1 font-medium">{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-2 w-12 h-0.5 bg-green-500 rounded-full"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 lg:w-64 bg-white border-r border-gray-100 flex-col z-50">
        {/* Logo */}
        <div className="p-4 lg:px-6 border-b border-gray-100">
          <Link to={createPageUrl('Home')} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <span className="hidden lg:block text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
              DishDollar
            </span>
          </Link>
        </div>

        {/* Nav Items */}
        <div className="flex-1 py-6 px-3 lg:px-4 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive = currentPageName === item.page;
            const Icon = item.icon;
            
            return (
              <Link key={item.page} to={createPageUrl(item.page)}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-3 lg:px-4 py-3 rounded-xl transition-colors ${
                    isActive 
                      ? 'bg-green-50 text-green-600' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                  <span className={`hidden lg:block font-medium ${isActive ? 'text-green-600' : ''}`}>
                    {item.name}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Add Recipe Button (Desktop) */}
        <div className="p-4">
          <Link to={createPageUrl('AddRecipe')}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-green-200"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden lg:block">Add Recipe</span>
            </motion.button>
          </Link>
        </div>
      </nav>

      {/* Content Padding for Desktop */}
      <style>{`
        @media (min-width: 768px) {
          main {
            margin-left: 5rem;
          }
        }
        @media (min-width: 1024px) {
          main {
            margin-left: 16rem;
          }
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </div>
  );
}
