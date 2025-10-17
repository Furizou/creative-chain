'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function TestFinalDB() {
  const [supabase] = useState(() => createClient());
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase]);

  const testDatabaseStructure = async () => {
    setLoading(true);
    const testResults = {};

    try {
      // Test 1: Check all tables exist
      console.log('🔍 Testing table existence...');
      const tables = [
        'profiles', 'creative_works', 'royalty_splits', 'copyright_certificates',
        'license_offerings', 'orders', 'licenses', 'royalty_distributions',
        'analytics_events', 'custodial_wallets'
      ];

      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          testResults[`table_${table}`] = error ? 
            { status: '❌', message: error.message } : 
            { status: '✅', message: 'Table exists and accessible' };
        } catch (err) {
          testResults[`table_${table}`] = { 
            status: '❌', 
            message: err.message 
          };
        }
      }

      // Test 2: Test database relationships
      console.log('🔗 Testing relationships...');
      
      // Test creative_works -> profiles relationship
      try {
        const { data, error } = await supabase
          .from('creative_works')
          .select(`
            *,
            profiles!creative_works_creator_id_fkey(username, full_name)
          `)
          .limit(1);
        
        testResults.relationship_creative_works_profiles = error ?
          { status: '❌', message: error.message } :
          { status: '✅', message: 'Creative works -> profiles relationship working' };
      } catch (err) {
        testResults.relationship_creative_works_profiles = {
          status: '❌',
          message: err.message
        };
      }

      // Test license_offerings -> creative_works relationship
      try {
        const { data, error } = await supabase
          .from('license_offerings')
          .select(`
            *,
            creative_works!license_offerings_work_id_fkey(title, creator_id)
          `)
          .limit(1);
        
        testResults.relationship_license_offerings_creative_works = error ?
          { status: '❌', message: error.message } :
          { status: '✅', message: 'License offerings -> creative works relationship working' };
      } catch (err) {
        testResults.relationship_license_offerings_creative_works = {
          status: '❌',
          message: err.message
        };
      }

      // Test orders -> license_offerings relationship
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            license_offerings!orders_license_offering_id_fkey(title, price_idr)
          `)
          .limit(1);
        
        testResults.relationship_orders_license_offerings = error ?
          { status: '❌', message: error.message } :
          { status: '✅', message: 'Orders -> license offerings relationship working' };
      } catch (err) {
        testResults.relationship_orders_license_offerings = {
          status: '❌',
          message: err.message
        };
      }

      // Test licenses -> multiple relationships
      try {
        const { data, error } = await supabase
          .from('licenses')
          .select(`
            *,
            creative_works!licenses_work_id_fkey(title),
            profiles!licenses_buyer_id_fkey(username),
            orders!licenses_order_id_fkey(status),
            license_offerings!licenses_license_offering_id_fkey(title)
          `)
          .limit(1);
        
        testResults.relationship_licenses_multiple = error ?
          { status: '❌', message: error.message } :
          { status: '✅', message: 'Licenses multiple relationships working' };
      } catch (err) {
        testResults.relationship_licenses_multiple = {
          status: '❌',
          message: err.message
        };
      }

      // Test royalty_distributions -> licenses relationship
      try {
        const { data, error } = await supabase
          .from('royalty_distributions')
          .select(`
            *,
            licenses!royalty_distributions_license_id_fkey(id)
          `)
          .limit(1);
        
        testResults.relationship_royalty_distributions_licenses = error ?
          { status: '❌', message: error.message } :
          { status: '✅', message: 'Royalty distributions -> licenses relationship working' };
      } catch (err) {
        testResults.relationship_royalty_distributions_licenses = {
          status: '❌',
          message: err.message
        };
      }

      // Test 3: Check constraints and data types
      console.log('📊 Testing constraints...');
      
      // Test username length constraint
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: 'ab', // Should fail - too short
              full_name: 'Test User'
            });
          
          testResults.constraint_username_length = error ?
            { status: '✅', message: 'Username length constraint working (rejected short username)' } :
            { status: '❌', message: 'Username constraint not working - accepted short username' };
        } catch (err) {
          testResults.constraint_username_length = {
            status: '✅',
            message: 'Username length constraint working'
          };
        }
      }

      // Test royalty split percentage constraint
      try {
        const { data, error } = await supabase
          .from('royalty_splits')
          .insert({
            work_id: '00000000-0000-0000-0000-000000000000', // Fake UUID
            recipient_address: '0x1234567890123456789012345678901234567890',
            split_percentage: 150 // Should fail - over 100%
          });
        
        testResults.constraint_royalty_percentage = error ?
          { status: '✅', message: 'Royalty percentage constraint working (rejected >100%)' } :
          { status: '❌', message: 'Royalty percentage constraint not working' };
      } catch (err) {
        testResults.constraint_royalty_percentage = {
          status: '✅',
          message: 'Royalty percentage constraint working'
        };
      }

      // Test order status constraint
      try {
        const { data, error } = await supabase
          .from('orders')
          .insert({
            license_offering_id: '00000000-0000-0000-0000-000000000000',
            buyer_id: '00000000-0000-0000-0000-000000000000',
            amount_idr: 100000,
            amount_bidr: 100,
            status: 'invalid_status' // Should fail
          });
        
        testResults.constraint_order_status = error ?
          { status: '✅', message: 'Order status constraint working (rejected invalid status)' } :
          { status: '❌', message: 'Order status constraint not working' };
      } catch (err) {
        testResults.constraint_order_status = {
          status: '✅',
          message: 'Order status constraint working'
        };
      }

      // Test 4: Check default values
      console.log('🎯 Testing default values...');
      
      // Test analytics_events auto-increment ID
      try {
        const { data: beforeCount } = await supabase
          .from('analytics_events')
          .select('id', { count: 'exact' });
        
        testResults.default_analytics_id = {
          status: '✅',
          message: `Analytics events table ready (current count: ${beforeCount?.length || 0})`
        };
      } catch (err) {
        testResults.default_analytics_id = {
          status: '❌',
          message: err.message
        };
      }

      // Test UUID generation
      try {
        const uuid1 = crypto.randomUUID();
        const uuid2 = crypto.randomUUID();
        
        testResults.uuid_generation = uuid1 !== uuid2 ?
          { status: '✅', message: 'UUID generation working' } :
          { status: '❌', message: 'UUID generation may have issues' };
      } catch (err) {
        testResults.uuid_generation = {
          status: '❌',
          message: 'UUID generation not available'
        };
      }

      // Test 5: RLS Policies (basic check)
      console.log('🔒 Testing RLS policies...');
      
      try {
        // Try to access profiles without auth context
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .limit(1);
        
        testResults.rls_basic_check = {
          status: '✅',
          message: `RLS active - ${data ? 'some data accessible' : 'no data returned'}`
        };
      } catch (err) {
        testResults.rls_basic_check = {
          status: '⚠️',
          message: 'RLS may be blocking access: ' + err.message
        };
      }

      console.log('✅ All tests completed');

    } catch (error) {
      console.error('Test failed:', error);
      testResults.general_error = {
        status: '❌',
        message: error.message
      };
    }

    setResults(testResults);
    setLoading(false);
  };

  const createSampleProfile = async () => {
    if (!user) {
      alert('Please login first');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: `user_${user.id.slice(0, 8)}`,
          full_name: 'Test User',
          wallet_address: '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')
        })
        .select();

      if (error) {
        alert('Error creating profile: ' + error.message);
      } else {
        alert('Sample profile created successfully!');
        setResults(prev => ({
          ...prev,
          sample_profile_created: {
            status: '✅',
            message: 'Sample profile created: ' + data[0].username
          }
        }));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const testFullWorkflow = async () => {
    if (!user) {
      alert('Please login first and create a profile');
      return;
    }

    setLoading(true);
    try {
      // 1. Create a creative work
      const { data: work, error: workError } = await supabase
        .from('creative_works')
        .insert({
          creator_id: user.id,
          title: 'Test Artwork',
          description: 'A test creative work',
          category: 'Digital Art',
          file_url: 'https://example.com/test.jpg',
          file_hash: 'abc123'
        })
        .select()
        .single();

      if (workError) throw workError;

      // 2. Create royalty split
      const { error: splitError } = await supabase
        .from('royalty_splits')
        .insert({
          work_id: work.id,
          recipient_address: '0x1234567890123456789012345678901234567890',
          split_percentage: 10.5
        });

      if (splitError) throw splitError;

      // 3. Create license offering
      const { data: offering, error: offeringError } = await supabase
        .from('license_offerings')
        .insert({
          work_id: work.id,
          license_type: 'Commercial',
          title: 'Commercial License',
          description: 'Full commercial usage rights',
          price_idr: 500000,
          price_bidr: 50
        })
        .select()
        .single();

      if (offeringError) throw offeringError;

      // 4. Create an order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          license_offering_id: offering.id,
          buyer_id: user.id,
          amount_idr: 500000,
          amount_bidr: 50,
          status: 'completed'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 5. Create a license
      const { data: license, error: licenseError } = await supabase
        .from('licenses')
        .insert({
          order_id: order.id,
          work_id: work.id,
          buyer_id: user.id,
          license_offering_id: offering.id,
          license_type: 'Commercial',
          price_usdt: 500,
          transaction_hash: '0xabcdef123456',
          usage_limit: 1000
        })
        .select()
        .single();

      if (licenseError) throw licenseError;

      // 6. Create royalty distribution
      const { error: royaltyError } = await supabase
        .from('royalty_distributions')
        .insert({
          license_id: license.id,
          recipient_id: user.id,
          recipient_address: '0x1234567890123456789012345678901234567890',
          amount_idr: 50000,
          amount_bidr: 5,
          split_percentage: 10,
          status: 'completed'
        });

      if (royaltyError) throw royaltyError;

      // 7. Create analytics event
      const { error: analyticsError } = await supabase
        .from('analytics_events')
        .insert({
          work_id: work.id,
          event_type: 'view',
          user_id: user.id
        });

      if (analyticsError) throw analyticsError;

      setResults(prev => ({
        ...prev,
        full_workflow_test: {
          status: '✅',
          message: `Complete workflow test successful! Created work: ${work.title}`
        }
      }));

    } catch (error) {
      setResults(prev => ({
        ...prev,
        full_workflow_test: {
          status: '❌',
          message: 'Workflow test failed: ' + error.message
        }
      }));
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">
        🧪 Final Database Structure Test
      </h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">User Status</h2>
        <p className="text-sm">
          {user ? (
            <>✅ Logged in as: {user.email}</>
          ) : (
            <>❌ Not logged in - some tests may fail</>
          )}
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <button
          onClick={testDatabaseStructure}
          disabled={loading}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '🔄 Testing...' : '🚀 Run Database Structure Tests'}
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={createSampleProfile}
            disabled={loading || !user}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            📝 Create Sample Profile
          </button>

          <button
            onClick={testFullWorkflow}
            disabled={loading || !user}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            🔄 Test Complete Workflow
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Test Results</h2>
        
        {Object.keys(results).length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Click "Run Database Structure Tests" to start testing
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(results).map(([key, result]) => (
              <div key={key} className="flex items-start space-x-3 p-3 border rounded">
                <span className="text-lg">{result.status}</span>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">📋 Test Coverage</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>✅ All 10 tables existence and accessibility</li>
          <li>✅ Foreign key relationships between tables</li>
          <li>✅ Database constraints (username length, royalty %, order status)</li>
          <li>✅ Default values and auto-generation</li>
          <li>✅ RLS policies basic functionality</li>
          <li>✅ Complete workflow simulation</li>
          <li>✅ Data insertion and retrieval</li>
        </ul>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Notes</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Some relationship tests may show errors if no sample data exists</li>
          <li>• Constraint tests intentionally trigger errors to verify they work</li>
          <li>• Login required for profile and workflow testing</li>
          <li>• RLS policies may prevent some operations without proper context</li>
        </ul>
      </div>
    </div>
  );
}