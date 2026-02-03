import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Utensils, DollarSign, ShoppingCart, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Utensils,
    title: "Discover Recipes",
    description: "Find delicious recipes tailored to your taste and dietary preferences",
    color: "bg-amber-100 text-amber-600"
  },
  {
    icon: DollarSign,
    title: "Real-Time Pricing",
    description: "See actual ingredient costs from your local grocery stores",
    color: "bg-green-100 text-green-600"
  },
  {
    icon: ShoppingCart,
    title: "Smart Shopping Lists",
    description: "Automatically generate shopping lists from your recipes",
    color: "bg-blue-100 text-blue-600"
  },
  {
    icon: Calendar,
    title: "Meal Planning",
    description: "Plan your week and stay within budget effortlessly",
    color: "bg-purple-100 text-purple-600"
  }
];

export default function AppIntroModal({ open, onClose }) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-10 text-white text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
              <span className="text-4xl">🍽️</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome to DishDollar</h1>
            <p className="text-green-100">
              Your smart kitchen companion for affordable, delicious meals
            </p>
          </div>

          {/* Features */}
          <div className="px-6 py-6 space-y-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${feature.color} flex items-center justify-center`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{feature.title}</h3>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="px-6 pb-6">
            <Button
              onClick={onClose}
              className="w-full py-6 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-lg font-semibold"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Let's Get Started!
            </Button>
            <p className="text-center text-xs text-gray-400 mt-3">
              Set up your profile in just a few minutes
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
