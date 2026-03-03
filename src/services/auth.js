import { supabase, isSupabaseConfigured } from '@/api/supabase';

// Demo user for when Supabase is not configured
const DEMO_USER = {
  id: 'demo-user',
  email: 'demo@dishdollar.app',
  name: 'Demo User'
};

const STORAGE_KEY = 'dishdollar_auth';

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

    // In demo mode, return null until user explicitly logs in
    return null;
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
    const user = { ...DEMO_USER, email, id: `user-${Date.now()}` };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  },

  /**
   * Sign up with email and password
   * @param {string} email
   * @param {string} password
   * @param {Object} metadata - Additional user metadata
   * @returns {Promise<Object>} User data
   */
  async signUp(email, password, metadata = {}) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      if (error) throw error;
      return data.user;
    }

    // Demo mode - just store the user
    const user = { id: `user-${Date.now()}`, email, name: email.split('@')[0], ...metadata };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  },

  /**
   * Sign in with Google OAuth
   * @returns {Promise<void>}
   */
  async signInWithGoogle() {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://dishdollar.com'
        }
      });
      if (error) throw error;
      return;
    }

    // Demo mode - simulate Google sign in
    const user = {
      id: `google-${Date.now()}`,
      email: 'demo.google@dishdollar.app',
      name: 'Google Demo User',
      app_metadata: { provider: 'google' }
    };
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

    // Clear all DishDollar data from localStorage
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('dishdollar_profile');

    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  },

  /**
   * Redirect to login page
   * @param {string} returnUrl - URL to return to after login
   */
  redirectToLogin(returnUrl) {
    // In this app, we handle auth in-app, so just redirect to login
    const url = new URL('/Login', window.location.origin);
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
  },

  /**
   * Check if running in demo mode
   * @returns {boolean}
   */
  isDemoMode() {
    return !isSupabaseConfigured;
  },

  /**
   * Permanently delete user account and all associated data
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async deleteAccount() {
    if (!isSupabaseConfigured || !supabase) {
      // Demo mode - just clear localStorage
      localStorage.clear();
      return { success: true, message: 'Demo account cleared' };
    }

    try {
      // Check if a Supabase session exists
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // No Supabase session — data lives only in localStorage (demo/local state)
        localStorage.clear();
        return { success: true, message: 'Account data cleared' };
      }

      // Get session for access token; refresh if stale
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data: refreshData } = await supabase.auth.refreshSession();
        session = refreshData?.session;
      }

      if (!session?.access_token) {
        throw new Error('Session expired. Please log in again.');
      }

      // Call backend to delete all user data
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://budgetbite-api-69cb51842c10.herokuapp.com';

      const response = await fetch(`${API_BASE}/api/users/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: user.id })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      // Clear all local data
      localStorage.clear();

      // Sign out locally
      await supabase.auth.signOut();

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Account deletion error:', error);
      throw error;
    }
  }
};

export default auth;
