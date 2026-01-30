/**
 * BudgetBite Services
 *
 * This module provides all the services needed for the app to function.
 * It works with Supabase when configured, or falls back to localStorage for demo mode.
 */

import { auth } from './auth';
import {
  entities,
  UserProfile,
  Recipe,
  SavedRecipe,
  MealPlan,
  BudgetEntry,
  ShoppingList,
  PantryItem
} from './entities';
import { supabase, isSupabaseConfigured } from '@/api/supabase';

// Main app client - replaces base44
export const budgetBite = {
  auth,
  entities,

  // Utility functions
  isConfigured: isSupabaseConfigured,

  // Analytics - no-op in standalone mode
  appLogs: {
    logUserInApp: (pageName) => {
      // In demo mode, just log to console
      console.log(`[BudgetBite] Page view: ${pageName}`);
      return Promise.resolve();
    }
  },

  // LLM integration placeholder
  integrations: {
    Core: {
      InvokeLLM: async (params) => {
        // This would integrate with Anthropic API in production
        // For now, return a mock response
        console.log('[BudgetBite] LLM invocation requested:', params);
        return {
          success: false,
          message: 'LLM integration not configured. Please set up Anthropic API.'
        };
      }
    }
  }
};

// Named exports for direct imports
export {
  auth,
  entities,
  UserProfile,
  Recipe,
  SavedRecipe,
  MealPlan,
  BudgetEntry,
  ShoppingList,
  PantryItem,
  supabase,
  isSupabaseConfigured
};

export default budgetBite;
