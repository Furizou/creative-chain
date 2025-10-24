'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for messages from URL params (e.g., from signup redirect)
    const urlMessage = searchParams.get('message');
    if (urlMessage) {
      setMessage(urlMessage);
    }
  }, [searchParams]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // Use client-side Supabase to login directly
      // This ensures session is stored in localStorage
      const supabase = createClient();

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        throw new Error(authError.message || 'Login failed');
      }

      if (!authData.session) {
        throw new Error('No session created');
      }

      console.log('✅ Login successful, session stored in localStorage');

      // Don't set loading to false - we're redirecting
      // Navigate to dashboard
      window.location.href = '/creator';

    } catch (error) {
      console.error('Login error:', error);
      setErrors({ submit: error.message });
      setIsLoading(false); // Only stop loading on error
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setMessage('');
    
    console.log('🔵 Starting demo login...');
    
    // Demo user credentials
    const demoCredentials = {
      email: 'demo@creativechain.com',
      password: 'Demo123456'
    };

    try {
      // Use client-side Supabase to login directly
      const supabase = createClient();

      console.log('🔵 Attempting Supabase authentication with demo credentials');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword(demoCredentials);

      if (authError) {
        console.error('❌ Login failed:', authError);
        throw new Error(authError.message || 'Demo login failed');
      }

      if (!authData.session) {
        throw new Error('No session created');
      }

      console.log('✅ Demo login successful, redirecting to dashboard');
      // Redirect to dashboard
      window.location.href = '/creator';

    } catch (error) {
      console.error('❌ Demo login error:', error);
      setErrors({ submit: error.message });
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-structural text-center">Welcome Back</h1>
        <p className="text-structural/70 text-center mt-2">Sign in to your SINAR account</p>
      </div>

      {/* URL Message */}
      {message && (
        <div className="mb-4 bg-primary/10 border border-primary/20 text-structural px-4 py-3 rounded-lg">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-structural mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
              errors.email ? 'border-warning bg-warning/5' : 'border-gray-300 bg-white'
            }`}
            placeholder="Enter your email"
          />
          {errors.email && <p className="text-warning text-sm mt-1">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-structural mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
              errors.password ? 'border-warning bg-warning/5' : 'border-gray-300 bg-white'
            }`}
            placeholder="Enter your password"
          />
          {errors.password && <p className="text-warning text-sm mt-1">{errors.password}</p>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-structural py-3 px-4 rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>

        {/* Error Messages */}
        {errors.submit && (
          <div className="bg-warning/10 border border-warning/20 text-warning px-4 py-3 rounded-lg">
            {errors.submit}
          </div>
        )}
      </form>

      {/* Demo Account */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-structural mb-3 text-center">Demo Account</h3>
        <button
          onClick={handleDemoLogin}
          disabled={isLoading}
          className="w-full bg-secondary text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-secondary/50 disabled:opacity-50 transition-all"
        >
          {isLoading ? 'Logging In...' : 'Login as Demo User'}
        </button>
      </div>

      {/* Forgot Password */}
      <div className="mt-4 text-center">
        <Link href="/forgot-password" className="text-sm text-secondary hover:text-secondary/80 font-medium transition-colors">
          Forgot your password?
        </Link>
      </div>

      {/* Signup Link */}
      <div className="mt-6 text-center">
        <p className="text-structural/70">
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary hover:text-primary/80 font-semibold transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-structural">Loading...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}