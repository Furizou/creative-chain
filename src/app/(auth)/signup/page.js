'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    username: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    // Username validation
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, hyphens, and underscores';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Generate unique request ID for client-side tracking
    const clientRequestId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔵 [CLIENT-${clientRequestId}] Starting signup submission`);
    console.log(`🔍 [CLIENT-${clientRequestId}] Form data:`, {
      email: formData.email ? '***@***.***' : '',
      hasPassword: !!formData.password,
      passwordLength: formData.password?.length || 0,
      fullName: formData.fullName,
      username: formData.username,
      hasConfirmPassword: !!formData.confirmPassword,
      passwordsMatch: formData.password === formData.confirmPassword
    });
    
    if (!validateForm()) {
      console.error(`❌ [CLIENT-${clientRequestId}] Form validation failed`);
      return;
    }

    console.log(`✅ [CLIENT-${clientRequestId}] Form validation passed`);
    setIsLoading(true);
    setMessage('');

    try {
      console.log(`🔵 [CLIENT-${clientRequestId}] Sending API request to /api/auth/signup`);
      
      const requestBody = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        username: formData.username
      };
      
      console.log(`🔍 [CLIENT-${clientRequestId}] Request payload:`, {
        email: requestBody.email ? '***@***.***' : '',
        hasPassword: !!requestBody.password,
        fullName: requestBody.fullName,
        username: requestBody.username
      });

      // Call our signup API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`🔍 [CLIENT-${clientRequestId}] API response status: ${response.status} ${response.statusText}`);
      
      let data;
      try {
        data = await response.json();
        console.log(`🔍 [CLIENT-${clientRequestId}] API response data:`, data);
      } catch (jsonError) {
        console.error(`❌ [CLIENT-${clientRequestId}] Failed to parse JSON response:`, jsonError);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        console.error(`❌ [CLIENT-${clientRequestId}] API request failed:`, {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          details: data.details
        });
        throw new Error(data.error || 'Signup failed');
      }

      console.log(`✅ [CLIENT-${clientRequestId}] Signup successful`);
      setMessage('Account created successfully! Redirecting to login...');
      
      // Redirect to login immediately since no email verification is required
      setTimeout(() => {
        console.log(`🔵 [CLIENT-${clientRequestId}] Redirecting to login page`);
        router.push('/login?message=Account created successfully! You can now login.');
      }, 1500);

    } catch (error) {
      console.error(`❌ [CLIENT-${clientRequestId}] Signup error:`, {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setErrors({ submit: error.message });
    } finally {
      setIsLoading(false);
      console.log(`🔵 [CLIENT-${clientRequestId}] Signup process completed`);
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

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 text-center">Create Account</h1>
        <p className="text-gray-600 text-center mt-2">Join CreativeChain to protect your creative works</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.fullName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your full name"
          />
          {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
        </div>

        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.username ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Choose a username"
          />
          {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
        </div>

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
            placeholder="Create a strong password"
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Confirm your password"
          />
          {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>

        {/* Error Messages */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {errors.submit}
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {message}
          </div>
        )}
      </form>

      {/* Login Link */}
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}