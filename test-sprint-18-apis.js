/**
 * Test Script for Sprint 18 APIs
 * Run this script to test all the new API endpoints
 * 
 * Usage: node test-apis.js
 */

const BASE_URL = 'http://localhost:3000';

async function testAPI(endpoint, method = 'GET', body = null, description) {
  console.log(`\n🧪 Testing: ${description}`);
  console.log(`📍 ${method} ${endpoint}`);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(BASE_URL + endpoint, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Response:`, JSON.stringify(data, null, 2).substring(0, 500) + '...');
    } else {
      console.log(`❌ Status: ${response.status}`);
      console.log(`📊 Error:`, data);
    }
  } catch (error) {
    console.log(`💥 Error:`, error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests for Sprint 18\n');
  console.log('=' .repeat(50));
  
  // Test 1: Creative Works Browse API
  await testAPI(
    '/api/creative-works?page=1&limit=5&sort_by=created_at&sort_order=desc',
    'GET',
    null,
    'Browse Creative Works with Pagination'
  );
  
  await testAPI(
    '/api/creative-works?search=music&category=audio&has_active_license=true',
    'GET',
    null,
    'Search Creative Works with Filters'
  );
  
  // Test 2: Analytics Creator Earnings API
  await testAPI(
    '/api/analytics/creator-earnings?group_by=date&date_from=2024-10-01&date_to=2024-10-31',
    'GET',
    null,
    'Creator Earnings Analytics - Grouped by Date'
  );
  
  await testAPI(
    '/api/analytics/creator-earnings?group_by=license_type',
    'GET',
    null,
    'Creator Earnings Analytics - Grouped by License Type'
  );
  
  await testAPI(
    '/api/analytics/creator-earnings?group_by=work',
    'GET',
    null,
    'Creator Earnings Analytics - Grouped by Work'
  );
  
  // Test 3: Transaction Ledger API (replace with actual work ID)
  const SAMPLE_WORK_ID = '123e4567-e89b-12d3-a456-426614174000'; // Replace with real ID
  
  await testAPI(
    `/api/ledger/${SAMPLE_WORK_ID}?page=1&limit=10&sort_by=purchased_at&sort_order=desc`,
    'GET',
    null,
    'Transaction Ledger with Pagination'
  );
  
  await testAPI(
    `/api/ledger/${SAMPLE_WORK_ID}?license_type=Commercial&date_from=2024-10-01`,
    'GET',
    null,
    'Transaction Ledger with Filters'
  );
  
  // Test 4: License Purchase API (requires authentication)
  await testAPI(
    '/api/licenses/purchase',
    'POST',
    {
      license_offering_id: '123e4567-e89b-12d3-a456-426614174000', // Replace with real ID
      payment_method: 'mock_gateway'
    },
    'Purchase License (requires auth)'
  );
  
  // Test 5: Analytics Events Creation
  await testAPI(
    '/api/analytics/creator-earnings',
    'POST',
    {
      work_id: '123e4567-e89b-12d3-a456-426614174000', // Replace with real ID
      event_type: 'view',
      user_id: null
    },
    'Create Analytics Event'
  );
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎉 API Tests Completed!');
  console.log('\n📝 Notes:');
  console.log('- Some tests may fail due to authentication requirements');
  console.log('- Replace sample UUIDs with real IDs from your database');
  console.log('- Check console for detailed error messages');
  console.log('- Endpoints returning 401 need authenticated sessions');
}

// Run the tests
runTests().catch(console.error);