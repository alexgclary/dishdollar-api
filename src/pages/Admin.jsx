import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { auth, entities, supabase, isSupabaseConfigured } from '@/services';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Users, ChefHat, Calendar,
  TrendingUp, RefreshCw, Shield, Database, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRecipes: 0,
    totalMealPlans: 0,
    recentSignups: [],
    authProviders: { email: 0, google: 0, demo: 0 }
  });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAndLoadStats();
  }, []);

  const checkAdminAndLoadStats = async () => {
    setIsLoading(true);
    try {
      const user = await auth.me();

      // Simple admin check - in production, use proper role-based auth
      const adminEmails = ['alex@dishdollar.app', 'admin@dishdollar.app', 'demo@dishdollar.app'];
      const userIsAdmin = user && (adminEmails.includes(user.email) || auth.isDemoMode());

      if (!userIsAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive"
        });
        navigate(createPageUrl('Home'));
        return;
      }

      setIsAdmin(true);
      await loadStats();
    } catch (error) {
      console.error('Admin check failed:', error);
      navigate(createPageUrl('Home'));
    }
  };

  const loadStats = async () => {
    try {
      // Get stats from Supabase or localStorage
      if (isSupabaseConfigured && supabase) {
        // Try to get user count from Supabase
        const { count: userCount } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true });

        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('created_date, auth_provider')
          .order('created_date', { ascending: false })
          .limit(10);

        const { count: recipeCount } = await supabase
          .from('recipes')
          .select('*', { count: 'exact', head: true });

        const { count: mealPlanCount } = await supabase
          .from('meal_plans')
          .select('*', { count: 'exact', head: true });

        // Calculate auth provider breakdown
        const providers = { email: 0, google: 0, demo: 0 };
        profiles?.forEach(p => {
          const provider = p.auth_provider || 'email';
          if (providers[provider] !== undefined) {
            providers[provider]++;
          }
        });

        setStats({
          totalUsers: userCount || 0,
          totalRecipes: recipeCount || 0,
          totalMealPlans: mealPlanCount || 0,
          recentSignups: profiles || [],
          authProviders: providers
        });
      } else {
        // Demo mode - get from localStorage
        const recipes = await entities.Recipe.list();
        const profiles = JSON.parse(localStorage.getItem('dishdollar_userprofile') || '[]');

        setStats({
          totalUsers: profiles.length || 1,
          totalRecipes: recipes.length,
          totalMealPlans: 0,
          recentSignups: [],
          authProviders: { email: 0, google: 0, demo: 1 }
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Set fallback stats
      setStats({
        totalUsers: 1,
        totalRecipes: 0,
        totalMealPlans: 0,
        recentSignups: [],
        authProviders: { email: 0, google: 0, demo: 1 }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await loadStats();
    toast({
      title: "Stats Refreshed",
      description: "Dashboard data has been updated"
    });
  };

  if (!isAdmin && !isLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate(createPageUrl('Home'))}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-amber-400" />
                  <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                </div>
                <p className="text-gray-300 text-sm mt-1">
                  DishDollar Analytics & User Management
                </p>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Mode Indicator */}
        <div className="mb-6">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isSupabaseConfigured
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            <Database className="w-4 h-4" />
            {isSupabaseConfigured ? 'Connected to Supabase' : 'Demo Mode (localStorage)'}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-800">
                  {isLoading ? '...' : stats.totalUsers}
                </div>
                <p className="text-xs text-gray-500 mt-1">Registered accounts</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <ChefHat className="w-4 h-4" />
                  Total Recipes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-800">
                  {isLoading ? '...' : stats.totalRecipes}
                </div>
                <p className="text-xs text-gray-500 mt-1">In database</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Meal Plans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-800">
                  {isLoading ? '...' : stats.totalMealPlans}
                </div>
                <p className="text-xs text-gray-500 mt-1">Active plans</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Auth Providers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Email</span>
                    <span className="font-semibold">{stats.authProviders.email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Google</span>
                    <span className="font-semibold">{stats.authProviders.google}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Demo</span>
                    <span className="font-semibold">{stats.authProviders.demo}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Signups */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                Recent Signups
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentSignups.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentSignups.map((signup, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">New User</p>
                          <p className="text-xs text-gray-500">
                            via {signup.auth_provider || 'email'}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(signup.created_date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No recent signups to display</p>
                  {!isSupabaseConfigured && (
                    <p className="text-xs mt-2">Connect Supabase to track signups</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Supabase Setup Guide */}
        {!isSupabaseConfigured && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-amber-800 flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Enable Full Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="text-amber-700">
                <p className="mb-4">
                  To enable real user tracking, connect your Supabase project:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Create a Supabase project at supabase.com</li>
                  <li>Enable Google OAuth in Authentication → Providers</li>
                  <li>Add environment variables to your deployment:
                    <code className="block mt-1 p-2 bg-amber-100 rounded text-xs">
                      VITE_SUPABASE_URL=your-project-url<br />
                      VITE_SUPABASE_ANON_KEY=your-anon-key
                    </code>
                  </li>
                  <li>Run the database migrations (see CLAUDE.md)</li>
                </ol>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
