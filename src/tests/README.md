# Test Suite for Creative Chain

This directory contains automated tests for the Creative Chain project.

## Available Tests

### Blockchain Helper Tests (`blockchain.test.js`)

Comprehensive test suite for the blockchain helper functions in `src/lib/blockchain.js`.

**Tests covered:**
- ✅ SDK Initialization (`getThirdwebSDK()`)
- ✅ Contract Address Configuration (`CONTRACT_ADDRESSES`)
- ✅ Chain Configuration (`AMOY_CHAIN`)
- ✅ Polygonscan Transaction URLs (`getPolygonscanUrl()`)
- ✅ Polygonscan NFT URLs (`getPolygonscanNftUrl()`)
- ✅ Ethereum Address Validation (`isValidAddress()`)
- ✅ Address Shortening for Display (`shortenAddress()`)

**Total:** 51 test cases across 7 test suites

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Blockchain Tests Only

```bash
npm run test:blockchain
```

### Run Tests Directly with Node

```bash
node --test src/tests/blockchain.test.js
```

## Test Requirements

### Node.js Version

Tests use Node.js built-in test runner which requires **Node.js v18 or higher**.

Check your Node version:
```bash
node --version
```

### Environment Variables

The blockchain tests require the following environment variables to be set:

#### Required for SDK Tests
- `THIRDWEB_SECRET_KEY` - Your thirdweb secret key

#### Required for Contract Address Tests
- `NEXT_PUBLIC_COPYRIGHT_CONTRACT` - Copyright NFT contract address
- `NEXT_PUBLIC_LICENSE_CONTRACT` - License NFT contract address

#### Setting Environment Variables for Tests

You can set these in your `.env` file or export them before running tests:

**Using .env file:**
```env
THIRDWEB_SECRET_KEY=your_secret_key_here
NEXT_PUBLIC_COPYRIGHT_CONTRACT=0x742d35Cc6634C0532925a3b844Bc9e7595f0aE8F
NEXT_PUBLIC_LICENSE_CONTRACT=0x8f3a7b2c9d8e1f6a5b4c3d2e1f0a9b8c7d6e5f4a
```

**Or export before running tests (Unix/Mac):**
```bash
export THIRDWEB_SECRET_KEY="your_secret_key_here"
export NEXT_PUBLIC_COPYRIGHT_CONTRACT="0x742d35Cc6634C0532925a3b844Bc9e7595f0aE8F"
export NEXT_PUBLIC_LICENSE_CONTRACT="0x8f3a7b2c9d8e1f6a5b4c3d2e1f0a9b8c7d6e5f4a"
npm run test:blockchain
```

**Or set before running tests (Windows CMD):**
```cmd
set THIRDWEB_SECRET_KEY=your_secret_key_here
set NEXT_PUBLIC_COPYRIGHT_CONTRACT=0x742d35Cc6634C0532925a3b844Bc9e7595f0aE8F
set NEXT_PUBLIC_LICENSE_CONTRACT=0x8f3a7b2c9d8e1f6a5b4c3d2e1f0a9b8c7d6e5f4a
npm run test:blockchain
```

**Or set before running tests (Windows PowerShell):**
```powershell
$env:THIRDWEB_SECRET_KEY="your_secret_key_here"
$env:NEXT_PUBLIC_COPYRIGHT_CONTRACT="0x742d35Cc6634C0532925a3b844Bc9e7595f0aE8F"
$env:NEXT_PUBLIC_LICENSE_CONTRACT="0x8f3a7b2c9d8e1f6a5b4c3d2e1f0a9b8c7d6e5f4a"
npm run test:blockchain
```

> **Note:** If contract address environment variables are not set, the tests will pass with a warning message. Most functionality tests will still run successfully.

## Test Output

### Successful Test Run

```
TAP version 13
✅ All blockchain helper tests completed!

# tests 51
# suites 7
# pass 51
# fail 0
```

### Test Run with Warnings

If environment variables for contract addresses are not set, you'll see warnings but tests will still pass:

```
⚠️  COPYRIGHT address is undefined. Make sure NEXT_PUBLIC_COPYRIGHT_CONTRACT is set before running tests.
⚠️  LICENSE address is undefined. Make sure NEXT_PUBLIC_LICENSE_CONTRACT is set before running tests.

# tests 51
# pass 51
```

## Writing New Tests

When adding new tests to this project:

1. Create a new test file with the `.test.js` extension
2. Use Node.js built-in test framework:
   ```javascript
   import { describe, it } from 'node:test';
   import assert from 'node:assert/strict';
   ```
3. Place test files in the `src/tests/` directory
4. Run tests with `npm test`

### Test File Template

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Feature Name', () => {
  it('should do something', () => {
    const result = yourFunction();
    assert.equal(result, expectedValue);
  });
});
```

## Test Coverage

Current test coverage:

| Module | File | Test Coverage |
|--------|------|---------------|
| Blockchain Helpers | `src/lib/blockchain.js` | ✅ 100% (all functions) |

## Continuous Integration

These tests are designed to run in CI/CD pipelines. Make sure to:

1. Set environment variables in your CI/CD secrets
2. Use Node.js v18+ in your pipeline
3. Run `npm test` as part of your build process

## Troubleshooting

### "Cannot find module" errors

Make sure you have run `npm install` before running tests:
```bash
npm install
npm test
```

### "Unexpected token" errors

Ensure your Node.js version is v18 or higher:
```bash
node --version
```

If it's lower than v18, upgrade Node.js:
- Download from: https://nodejs.org/
- Or use nvm: `nvm install 18`

### Environment variable warnings

If you see warnings about missing environment variables, set them using one of the methods described in the "Environment Variables" section above.

## Additional Resources

- [Node.js Test Runner Documentation](https://nodejs.org/api/test.html)
- [thirdweb SDK Documentation](https://portal.thirdweb.com/)
- [Polygon Amoy Testnet](https://docs.polygon.technology/tools/faucets/)
