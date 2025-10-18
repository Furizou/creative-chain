'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function TestAuthPage() {
  const { user, profile, loading, isAuthenticated } = useAuth();
  const [demoUsersStatus, setDemoUsersStatus] = useState(null);
  const [loadingDemo, setLoadingDemo] = useState(false);

  useEffect(() => {
    checkDemoUsers();
  }, []);

  const checkDemoUsers = async () => {
    try {
      const response = await fetch('/api/auth/demo-users');
      const data = await response.json();
      setDemoUsersStatus(data);
    } catch (error) {
      console.error('Error checking demo users:', error);
    }
  };

  const createDemoUsers = async () => {
    setLoadingDemo(true);
    try {
      const response = await fetch('/api/auth/demo-users', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        alert('Demo users created successfully!');
        checkDemoUsers();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating demo users:', error);
      alert('Error creating demo users');
    } finally {
      setLoadingDemo(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">
        🔐 Authentication System Test
      </h1>

      {/* Authentication Status */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Authentication Status</h2>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <span className={`text-2xl ${isAuthenticated ? '✅' : '❌'}`}></span>
            <span className="font-medium">
              {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </span>
          </div>

          {user && (
            <>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">User Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Email Confirmed:</strong> {user.email_confirmed_at ? '✅' : '❌'}</p>
                  <p><strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {profile && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Profile Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <p><strong>Username:</strong> {profile.username || 'Not set'}</p>
                    <p><strong>Full Name:</strong> {profile.full_name || 'Not set'}</p>
                    <p><strong>Wallet:</strong> {profile.wallet_address ? '✅ Connected' : '❌ Not connected'}</p>
                    <p><strong>Avatar:</strong> {profile.avatar_url ? '✅ Set' : '❌ Not set'}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Demo Users Management */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Demo Users Management</h2>
        
        <div className="flex gap-4 mb-4">
          <button
            onClick={createDemoUsers}
            disabled={loadingDemo}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loadingDemo ? 'Creating...' : 'Create Demo Users'}
          </button>
          
          <button
            onClick={checkDemoUsers}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Refresh Status
          </button>
        </div>

        {demoUsersStatus && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Demo Users Status</h3>
            <div className="grid gap-2">
              {demoUsersStatus.demoUsers.map((demoUser, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <span className="font-medium">{demoUser.email}</span>
                    <span className="text-sm text-gray-500 ml-2">({demoUser.role})</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    demoUser.exists 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {demoUser.exists ? 'EXISTS' : 'NOT FOUND'}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Total users in system: {demoUsersStatus.totalUsers}
            </p>
          </div>
        )}
      </div>

      {/* Test Actions */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Test Actions</h2>
        
        {!isAuthenticated ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Authentication Required</h3>
              <p className="text-gray-600 mb-4">Please sign in to test authenticated features.</p>
              
              <div className="flex gap-4">
                <a 
                  href="/login" 
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  Go to Login
                </a>
                <a 
                  href="/signup" 
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Create Account
                </a>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Demo Credentials</h4>
              <div className="text-sm space-y-2">
                <p><strong>Creator Account:</strong> creator@demo.com / Demo123!</p>
                <p><strong>Buyer Account:</strong> buyer@demo.com / Demo123!</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a 
                href="/profile" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-center"
              >
                View Profile
              </a>
              <a 
                href="/creator" 
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-center"
              >
                Creator Dashboard
              </a>
              <a 
                href="/marketplace" 
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-center"
              >
                Marketplace
              </a>
            </div>
          </div>
        )}
      </div>

      {/* API Endpoints Test */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">API Endpoints</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <h4 className="font-semibold">Authentication</h4>
            <ul className="space-y-1 mt-2">
              <li>✅ POST /api/auth/signup</li>
              <li>✅ POST /api/auth/login</li>
              <li>✅ POST /api/auth/logout</li>
              <li>✅ POST /api/auth/demo-users</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <h4 className="font-semibold">Profile</h4>
            <ul className="space-y-1 mt-2">
              <li>✅ GET /api/profile</li>
              <li>✅ PUT /api/profile</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <h4 className="font-semibold">Protected Routes</h4>
            <ul className="space-y-1 mt-2">
              <li>✅ /creator (dashboard)</li>
              <li>✅ /profile (user profile)</li>
              <li>✅ /upload (file upload)</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <h4 className="font-semibold">Features</h4>
            <ul className="space-y-1 mt-2">
              <li>✅ Middleware protection</li>
              <li>✅ Custodial wallet creation</li>
              <li>✅ Form validation</li>
              <li>✅ Session management</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}