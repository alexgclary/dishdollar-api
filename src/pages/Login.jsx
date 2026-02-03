import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { auth, isSupabaseConfigured } from '@/services';
import { ChefHat, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { FloatingVegetables, WavyBackground } from '@/components/ui/DecorativeElements';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const returnUrl = searchParams.get('returnUrl');

  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await auth.me();
        if (user) {
          // Check if user has profile
          const localProfile = localStorage.getItem('dishdollar_profile');
          if (localProfile) {
            navigate(returnUrl || createPageUrl('Home'));
          } else {
            navigate(createPageUrl('Onboarding'));
          }
        }
      } catch {
        // Not logged in, stay on login page
      }
    };
    checkAuth();
  }, [navigate, returnUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          setIsLoading(false);
          return;
        }

        // Sign up
        const user = await auth.signUp(formData.email, formData.password, {
          created_at: new Date().toISOString(),
          auth_provider: 'email'
        });

        toast({
          title: 'Account created!',
          description: isSupabaseConfigured
            ? 'Please check your email to verify your account.'
            : 'Welcome to DishDollar!'
        });

        // Redirect to onboarding for new users
        navigate(createPageUrl('Onboarding'));
      } else {
        // Sign in
        await auth.signIn(formData.email, formData.password);

        toast({
          title: 'Welcome back!',
          description: 'You have been signed in successfully.'
        });

        // Check if user has profile
        const localProfile = localStorage.getItem('dishdollar_profile');
        if (localProfile) {
          navigate(returnUrl || createPageUrl('Home'));
        } else {
          navigate(createPageUrl('Onboarding'));
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      const result = await auth.signInWithGoogle();

      // In demo mode, signInWithGoogle returns the user directly
      if (result) {
        toast({
          title: 'Welcome!',
          description: 'Signed in with Google (demo mode)'
        });
        navigate(createPageUrl('Onboarding'));
      }
      // In production mode, the user is redirected to Google OAuth
    } catch (err) {
      console.error('Google sign in error:', err);
      setError(err.message || 'Failed to sign in with Google');
      setIsGoogleLoading(false);
    }
  };

  const handleDemoMode = async () => {
    setIsLoading(true);
    try {
      await auth.signIn('demo@dishdollar.app', 'demo123');
      toast({
        title: 'Demo Mode',
        description: 'Signed in as demo user'
      });
      navigate(createPageUrl('Onboarding'));
    } catch (err) {
      console.error('Demo login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50 relative overflow-hidden flex items-center justify-center">
      <FloatingVegetables />
      <WavyBackground />

      <div className="relative z-10 w-full max-w-md px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-8"
        >
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <Link to={createPageUrl('Welcome')} className="inline-block">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-200">
                <ChefHat className="w-8 h-8 text-white" />
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-gray-500 mt-1">
              {isSignUp ? 'Join DishDollar today' : 'Sign in to continue'}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full mb-4 py-6 rounded-xl border-2 hover:bg-gray-50"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative flex items-center my-6">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">or</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="pl-10 rounded-xl border-2"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  className="pl-10 pr-10 rounded-xl border-2"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm password"
                    className="pl-10 rounded-xl border-2"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          {/* Demo Mode */}
          {!isSupabaseConfigured && (
            <div className="mt-4 text-center">
              <button
                onClick={handleDemoMode}
                disabled={isLoading}
                className="text-gray-500 hover:text-gray-700 text-sm underline"
              >
                Try Demo Mode
              </button>
            </div>
          )}

          {/* Back to Welcome */}
          <div className="mt-6 text-center">
            <Link to={createPageUrl('Welcome')} className="text-gray-400 hover:text-gray-600 text-sm">
              Back to home
            </Link>
          </div>
        </motion.div>

        {/* Demo Mode Indicator */}
        {!isSupabaseConfigured && (
          <div className="mt-4 text-center">
            <span className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
              Running in Demo Mode
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
