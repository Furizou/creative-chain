/**
 * Test blockchain verification directly
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getNFTMetadata } from './src/lib/blockchain-minting.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

async function testVerification() {
  console.log('\nTesting blockchain verification for Token ID: 2\n');

  try {
    const metadata = await getNFTMetadata('2');
    console.log('✅ Metadata retrieved successfully:');
    console.log(JSON.stringify(metadata, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testVerification();
