import { supabase, isSupabaseConfigured } from '@/api/supabase';

// Demo user for when Supabase is not configured
const DEMO_USER = {
  id: 'demo-user',
  email: 'demo@budgetbite.app',
  name: 'Demo User'
};

const STORAGE_KEY = 'budgetbite_auth';

/**
 * Authentication service that works with Supabase or falls back to localStorage demo mode
 */
export const auth = {
  /**
   * Get current user
   * @returns {Promise<Object|null>} Current user or null
   */
  async me() {
    if (isSupabaseConfigured && supabase) {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    }

    // Demo mode - check localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    // In demo mode, auto-create a demo user
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_USER));
    return DEMO_USER;
  },

  /**
   * Sign in with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>} User data
   */
  async signIn(email, password) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return data.user;
    }

    // Demo mode - just store the user
    const user = { ...DEMO_USER, email };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  },

  /**
   * Sign up with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>} User data
   */
  async signUp(email, password) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      if (error) throw error;
      return data.user;
    }

    // Demo mode - just store the user
    const user = { id: `user-${Date.now()}`, email, name: email.split('@')[0] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  },

  /**
   * Sign out current user
   * @param {string} [redirectUrl] - URL to redirect to after logout
   */
  async logout(redirectUrl) {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }

    localStorage.removeItem(STORAGE_KEY);

    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  },

  /**
   * Redirect to login page
   * @param {string} returnUrl - URL to return to after login
   */
  redirectToLogin(returnUrl) {
    // In this app, we handle auth in-app, so just redirect to welcome
    const url = new URL('/Welcome', window.location.origin);
    if (returnUrl) {
      url.searchParams.set('returnUrl', returnUrl);
    }
    window.location.href = url.toString();
  },

  /**
   * Subscribe to auth state changes
   * @param {Function} callback - Called with user object when auth state changes
   * @returns {Function} Unsubscribe function
   */
  onAuthStateChange(callback) {
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        callback(session?.user || null);
      });
      return () => subscription.unsubscribe();
    }

    // Demo mode - no real-time auth state, just call with current user
    auth.me().then(callback);
    return () => {}; // No-op unsubscribe
  }
};

export default auth;
