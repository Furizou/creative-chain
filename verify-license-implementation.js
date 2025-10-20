/**
 * Verification script for License NFT Minting Implementation
 *
 * Checks if all required files and configurations are in place
 *
 * Usage: node verify-license-implementation.js
 */

import fs from 'fs';
import path from 'path';
import 'dotenv/config';

console.log('='.repeat(70));
console.log('LICENSE NFT MINTING IMPLEMENTATION VERIFICATION');
console.log('='.repeat(70));
console.log();

const checks = [];

// File checks
const requiredFiles = [
  {
    path: 'supabase/migrations/003_create_licenses.sql',
    description: 'Database migration for licenses table'
  },
  {
    path: 'src/lib/blockchain-minting.js',
    description: 'Blockchain minting functions',
    contains: ['createLicenseNFTMetadata', 'mintLicenseNFT', 'isValidLicenseType']
  },
  {
    path: 'src/app/api/blockchain/mint-license/route.js',
    description: 'License minting API endpoint'
  },
  {
    path: 'test-mint-license.js',
    description: 'Test script for license minting'
  },
  {
    path: 'src/tests/mint-license-api.test.js',
    description: 'Jest test suite for license API'
  },
  {
    path: 'LICENSE_MINTING_IMPLEMENTATION.md',
    description: 'Implementation documentation'
  }
];

console.log('📁 Checking Required Files...\n');

requiredFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file.path);
  const exists = fs.existsSync(fullPath);

  let contentCheck = true;
  let missingFunctions = [];

  if (exists && file.contains) {
    const content = fs.readFileSync(fullPath, 'utf8');
    file.contains.forEach(searchTerm => {
      if (!content.includes(searchTerm)) {
        contentCheck = false;
        missingFunctions.push(searchTerm);
      }
    });
  }

  const status = exists && contentCheck ? '✅' : '❌';
  const result = {
    name: file.description,
    status: exists && contentCheck,
    path: file.path
  };

  console.log(`${status} ${file.description}`);
  console.log(`   Path: ${file.path}`);

  if (!exists) {
    console.log(`   ⚠️  File not found!`);
  } else if (!contentCheck) {
    console.log(`   ⚠️  Missing functions: ${missingFunctions.join(', ')}`);
  }
  console.log();

  checks.push(result);
});

// Environment variable checks
console.log('🔧 Checking Environment Variables...\n');

const requiredEnvVars = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase project URL'
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Supabase service role key'
  },
  {
    name: 'WALLET_ENCRYPTION_KEY',
    description: 'Wallet encryption key'
  },
  {
    name: 'MINTING_WALLET_PRIVATE_KEY',
    description: 'Master minting wallet private key'
  },
  {
    name: 'THIRDWEB_SECRET_KEY',
    description: 'Thirdweb API secret key'
  },
  {
    name: 'NEXT_PUBLIC_LICENSE_CONTRACT',
    description: 'License NFT contract address',
    optional: true,
    alternatives: ['NEXT_PUBLIC_LICENSE_NFT_CONTRACT']
  }
];

requiredEnvVars.forEach(envVar => {
  let value = process.env[envVar.name];

  // Check alternatives
  if (!value && envVar.alternatives) {
    for (const alt of envVar.alternatives) {
      if (process.env[alt]) {
        value = process.env[alt];
        envVar.usedAlternative = alt;
        break;
      }
    }
  }

  const exists = !!value;
  const status = exists ? '✅' : (envVar.optional ? '⚠️' : '❌');
  const result = {
    name: envVar.description,
    status: exists || envVar.optional,
    envVar: envVar.name
  };

  console.log(`${status} ${envVar.description}`);
  console.log(`   Variable: ${envVar.name}`);

  if (envVar.usedAlternative) {
    console.log(`   Using alternative: ${envVar.usedAlternative}`);
  }

  if (exists) {
    // Show first/last few characters for verification
    const masked = value.length > 10
      ? `${value.substring(0, 6)}...${value.substring(value.length - 4)}`
      : '***';
    console.log(`   Value: ${masked}`);
  } else if (envVar.optional) {
    console.log(`   Optional - not set`);
  } else {
    console.log(`   ⚠️  NOT SET - Required!`);
  }
  console.log();

  checks.push(result);
});

// Function implementation checks
console.log('⚙️  Checking Function Implementations...\n');

try {
  const blockchainMintingPath = path.join(process.cwd(), 'src/lib/blockchain-minting.js');
  const content = fs.readFileSync(blockchainMintingPath, 'utf8');

  const functions = [
    'isValidLicenseType',
    'createLicenseNFTMetadata',
    'mintLicenseNFT',
    'getLicenseTotalSupply',
    'getLicenseNFTMetadata',
    'verifyLicenseNFTOwnership',
    'createLicenseRecord'
  ];

  functions.forEach(func => {
    const hasFunction = content.includes(`export function ${func}`) ||
                       content.includes(`export async function ${func}`);
    const status = hasFunction ? '✅' : '❌';

    console.log(`${status} ${func}()`);
    checks.push({ name: func, status: hasFunction, type: 'function' });
  });
} catch (error) {
  console.log(`❌ Could not read blockchain-minting.js: ${error.message}`);
}

console.log();

// Database schema check
console.log('🗄️  Checking Database Schema...\n');

try {
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/003_create_licenses.sql');
  const migration = fs.readFileSync(migrationPath, 'utf8');

  const schemaChecks = [
    { name: 'licenses table', pattern: 'CREATE TABLE.*licenses' },
    { name: 'buyer_user_id column', pattern: 'buyer_user_id' },
    { name: 'token_id column', pattern: 'token_id' },
    { name: 'license_type column', pattern: 'license_type' },
    { name: 'expires_at column', pattern: 'expires_at' },
    { name: 'usage_limit column', pattern: 'usage_limit' },
    { name: 'is_valid column', pattern: 'is_valid' },
    { name: 'RLS enabled', pattern: 'ENABLE ROW LEVEL SECURITY' },
    { name: 'Validity trigger', pattern: 'check_license_validity' }
  ];

  schemaChecks.forEach(check => {
    const hasPattern = new RegExp(check.pattern, 'i').test(migration);
    const status = hasPattern ? '✅' : '❌';

    console.log(`${status} ${check.name}`);
    checks.push({ name: check.name, status: hasPattern, type: 'schema' });
  });
} catch (error) {
  console.log(`❌ Could not read migration file: ${error.message}`);
}

console.log();

// Summary
console.log('='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));
console.log();

const totalChecks = checks.length;
const passedChecks = checks.filter(c => c.status).length;
const failedChecks = totalChecks - passedChecks;

console.log(`Total Checks: ${totalChecks}`);
console.log(`✅ Passed: ${passedChecks}`);
console.log(`❌ Failed: ${failedChecks}`);
console.log();

const percentage = Math.round((passedChecks / totalChecks) * 100);
console.log(`Completion: ${percentage}%`);
console.log();

if (failedChecks === 0) {
  console.log('🎉 All checks passed! Implementation is complete and ready for testing.');
  console.log();
  console.log('Next Steps:');
  console.log('1. Run database migration: 003_create_licenses.sql');
  console.log('2. Ensure LICENSE contract is deployed and address is in .env');
  console.log('3. Run tests: node test-mint-license.js');
} else {
  console.log('⚠️  Some checks failed. Please review the issues above.');
  console.log();
  console.log('Failed Checks:');
  checks.filter(c => !c.status).forEach(c => {
    console.log(`  - ${c.name}`);
  });
}

console.log();
console.log('='.repeat(70));

process.exit(failedChecks === 0 ? 0 : 1);
