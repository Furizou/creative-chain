/**
 * Quick script to fix the token ID in the database
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixTokenId() {
  const txHash = '0x2a59744cc6ffca10e0de79a11c8cd8f9299820003306950668780d64bcc2ffd7';
  const correctTokenId = '2';

  console.log('Updating token ID from "unknown" to "2"...');

  const { data, error } = await supabase
    .from('copyright_certificates')
    .update({ token_id: correctTokenId })
    .eq('transaction_hash', txHash)
    .select();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Updated successfully!');
    console.log(data);
  }
}

fixTokenId();
