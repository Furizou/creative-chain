'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

export default function TestDbPage() {
  const [profilesResult, setProfilesResult] = useState({ data: null, error: null })
  const [worksResult, setWorksResult] = useState({ data: null, error: null })
  const [connectionStatus, setConnectionStatus] = useState('Loading...')
  const [seedMessage, setSeedMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const testConnection = async () => {
    const supabase = createClient()
    
    try {
      // Test profiles table
      const profilesRes = await supabase
        .from('profiles')
        .select('id, username, full_name, created_at')
        .limit(5)
      
      setProfilesResult(profilesRes)
      
      // Test creative_works table
      const worksRes = await supabase
        .from('creative_works')
        .select('id, title, category, created_at')
        .limit(5)
      
      setWorksResult(worksRes)
      setConnectionStatus('Connected')
    } catch (error) {
      setConnectionStatus(`Error: ${error.message}`)
    }
  }

  const handleSeedAction = async (action) => {
    setIsLoading(true)
    setSeedMessage('')
    
    try {
      const response = await fetch('/api/seed-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setSeedMessage(`✅ ${result.message}`)
        // Refresh data
        testConnection()
      } else {
        setSeedMessage(`❌ Error: ${result.error || result.message}`)
      }
    } catch (error) {
      setSeedMessage(`❌ Error: ${error.message}`)
    }
    
    setIsLoading(false)
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Database Connection Test</h1>
      
      <div className="space-y-6">
        {/* Connection Status */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
          <p className={`text-lg font-medium ${
            connectionStatus === 'Connected' ? 'text-green-600' : 'text-red-600'
          }`}>
            {connectionStatus}
          </p>
        </div>

        {/* Profiles Test */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Profiles Table Test</h2>
          {profilesResult.error ? (
            <p className="text-red-600">Error: {profilesResult.error.message}</p>
          ) : (
            <div>
              <p className="text-green-600 mb-2">✅ Query successful</p>
              <p>Records found: {profilesResult.data?.length || 0}</p>
              {profilesResult.data?.length > 0 && (
                <pre className="bg-white p-2 rounded text-sm mt-2 overflow-auto">
                  {JSON.stringify(profilesResult.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Creative Works Test */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Creative Works Table Test</h2>
          {worksResult.error ? (
            <p className="text-red-600">Error: {worksResult.error.message}</p>
          ) : (
            <div>
              <p className="text-green-600 mb-2">✅ Query successful</p>
              <p>Records found: {worksResult.data?.length || 0}</p>
              {worksResult.data?.length > 0 && (
                <pre className="bg-white p-2 rounded text-sm mt-2 overflow-auto">
                  {JSON.stringify(worksResult.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Seeding Controls */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Sample Data Management</h2>
          <p className="text-sm text-gray-600 mb-4">
            Create sample data after users have signed up through auth system.
          </p>
          <div className="space-x-2 mb-4">
            <button 
              onClick={() => handleSeedAction('seed')}
              disabled={isLoading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Create Sample Data'}
            </button>
            <button 
              onClick={() => handleSeedAction('cleanup')}
              disabled={isLoading}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Cleanup Sample Data'}
            </button>
            <button 
              onClick={testConnection}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Refresh Data
            </button>
          </div>
          {seedMessage && (
            <div className="text-sm font-medium">
              {seedMessage}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Next Steps</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>If connection is successful, RLS policies are working correctly</li>
            <li>Empty results are expected since no users have signed up yet</li>
            <li>Create users through signup first, then use "Create Sample Data" button</li>
            <li>Authentication system needs to be implemented next</li>
            <li>Once users sign up, profile data will appear here</li>
          </ul>
        </div>

        {/* Environment Check */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Environment Variables Check</h2>
          <div className="space-y-1 text-sm">
            <p>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
            <p>SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}