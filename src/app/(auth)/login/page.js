'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
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

  const handleDemoLogin = async (demoType) => {
    setIsLoading(true);
    
    // Generate unique request ID for client-side tracking
    const clientRequestId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔵 [CLIENT-${clientRequestId}] Starting demo login for: ${demoType}`);
    
    const demoCredentials = {
      creator: { email: 'creator@demo.com', password: 'Demo123!' },
      buyer: { email: 'buyer@demo.com', password: 'Demo123!' }
    };

    try {
      const creds = demoCredentials[demoType];
      console.log(`🔍 [CLIENT-${clientRequestId}] Demo credentials:`, {
        email: creds.email,
        hasPassword: !!creds.password
      });

      // Use client-side Supabase to login directly
      const supabase = createClient();

      console.log(`🔵 [CLIENT-${clientRequestId}] Attempting Supabase authentication`);
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword(creds);

      if (authError) {
        console.error(`❌ [CLIENT-${clientRequestId}] Login failed:`, authError);
        throw new Error(authError.message || 'Demo login failed');
      }

      if (!authData.session) {
        throw new Error('No session created');
      }

      console.log(`✅ [CLIENT-${clientRequestId}] Demo login successful, redirecting to dashboard`);
      // Don't set loading to false - we're redirecting
      window.location.href = '/creator';

    } catch (error) {
      console.error(`❌ [CLIENT-${clientRequestId}] Demo login error:`, {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setErrors({ submit: error.message });
      setIsLoading(false); // Only stop loading on error
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 text-center">Welcome Back</h1>
        <p className="text-gray-600 text-center mt-2">Sign in to your CreativeChain account</p>
      </div>

      {/* URL Message */}
      {message && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your email"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your password"
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>

        {/* Error Messages */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {errors.submit}
          </div>
        )}
      </form>

      {/* Demo Accounts */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2 text-center">Demo Accounts</h3>
        <div className="space-y-2">
          <button
            onClick={() => handleDemoLogin('creator')}
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 text-sm transition-colors"
          >
            Login as Demo Creator
          </button>
          <button
            onClick={() => handleDemoLogin('buyer')}
            disabled={isLoading}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 text-sm transition-colors"
          >
            Login as Demo Buyer
          </button>
        </div>
      </div>

      {/* Forgot Password */}
      <div className="mt-4 text-center">
        <Link href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700">
          Forgot your password?
        </Link>
      </div>

      {/* Signup Link */}
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <Link href="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Create one
          </Link>
        </p>
      </div>
    </>
  );
}