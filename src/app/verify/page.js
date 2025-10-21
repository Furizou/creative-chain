'use client';

import { useState } from 'react';

/**
 * Blockchain Verification Page
 * Allows users to verify copyright certificates and licenses by:
 * - Transaction Hash
 * - Token ID
 * - Work Hash
 * - Certificate ID
 */
export default function VerifyPage() {
  const [searchType, setSearchType] = useState('tx');
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  const searchTypes = [
    { value: 'tx', label: 'Transaction Hash', placeholder: '0x...' },
    { value: 'tokenId', label: 'Token ID', placeholder: 'Enter token ID' },
    { value: 'workHash', label: 'Work Hash', placeholder: 'Enter work hash' },
    { value: 'certificateId', label: 'Certificate ID', placeholder: 'Enter certificate UUID' },
  ];

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchValue.trim()) {
      setError('Please enter a value to search');
      return;
    }

    setIsLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      const response = await fetch(`/api/blockchain/verify-certificate?${searchType}=${encodeURIComponent(searchValue.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Verification failed');
      }

      setVerificationResult(data);
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify certificate');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSearchValue('');
    setError(null);
    setVerificationResult(null);
  };

  return (
    <div className="min-h-screen bg-base py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-structural mb-2">
            Blockchain Verification
          </h1>
          <p className="text-structural">
            Verify the authenticity of copyright certificates and licenses on the blockchain
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-8">
            <form onSubmit={handleSearch}>
              {/* Search Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-structural mb-3">
                  Search by
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {searchTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        setSearchType(type.value);
                        setSearchValue('');
                        setError(null);
                        setVerificationResult(null);
                      }}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        searchType === type.value
                          ? 'bg-primary text-structural'
                          : 'bg-base text-structural hover:bg-gray-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Input */}
              <div className="mb-6">
                <label htmlFor="searchValue" className="block text-sm font-medium text-structural mb-2">
                  {searchTypes.find(t => t.value === searchType)?.label}
                </label>
                <input
                  type="text"
                  id="searchValue"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={searchTypes.find(t => t.value === searchType)?.placeholder}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm text-structural"
                  disabled={isLoading}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading || !searchValue.trim()}
                  className="flex-1 bg-primary text-structural px-6 py-3 rounded-md font-medium hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-structural" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    'Verify'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isLoading}
                  className="px-6 py-3 border border-gray-300 rounded-md font-medium text-structural hover:bg-base focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-white border-2 border-warning rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-warning mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-warning">Verification Failed</h3>
                <p className="text-sm text-structural mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Verification Results */}
        {verificationResult && (
          <div className="space-y-6">
            {/* Status Card */}
            <div className={`rounded-lg p-6 border-2 bg-white ${
              verificationResult.verified
                ? 'border-primary'
                : 'border-warning'
            }`}>
              <div className="flex items-start">
                {verificationResult.verified ? (
                  <svg className="h-8 w-8 text-primary mr-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-8 w-8 text-warning mr-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2 text-structural">
                    {verificationResult.verified ? 'Certificate Verified' : 'Verification Failed'}
                  </h2>
                  <p className="text-sm mb-2 text-structural">
                    Status: <span className="font-semibold uppercase">{verificationResult.status}</span>
                  </p>
                  <p className="text-xs text-structural opacity-70">
                    Verified at: {new Date(verificationResult.verifiedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Issues */}
              {verificationResult.issues && verificationResult.issues.length > 0 && (
                <div className="mt-4 pt-4 border-t border-warning">
                  <h3 className="text-sm font-semibold text-warning mb-2">Issues Found:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {verificationResult.issues.map((issue, index) => (
                      <li key={index} className="text-sm text-structural">{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Certificate Details */}
            {verificationResult.certificate && (
              <>
                {/* Work Details */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-base border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-structural">Work Details</h3>
                  </div>
                  <div className="px-6 py-6">
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {verificationResult.certificate.workDetails?.title && (
                        <div>
                          <dt className="text-sm font-medium text-structural opacity-60">Title</dt>
                          <dd className="mt-1 text-sm text-structural font-semibold">
                            {verificationResult.certificate.workDetails.title}
                          </dd>
                        </div>
                      )}
                      {verificationResult.certificate.workDetails?.creator && (
                        <div>
                          <dt className="text-sm font-medium text-structural opacity-60">Creator</dt>
                          <dd className="mt-1 text-sm text-structural">
                            {verificationResult.certificate.workDetails.creator}
                          </dd>
                        </div>
                      )}
                      {verificationResult.certificate.workDetails?.category && (
                        <div>
                          <dt className="text-sm font-medium text-structural opacity-60">Category</dt>
                          <dd className="mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-white">
                              {verificationResult.certificate.workDetails.category}
                            </span>
                          </dd>
                        </div>
                      )}
                      {verificationResult.certificate.workDetails?.registeredAt && (
                        <div>
                          <dt className="text-sm font-medium text-structural opacity-60">Registered</dt>
                          <dd className="mt-1 text-sm text-structural">
                            {new Date(verificationResult.certificate.workDetails.registeredAt).toLocaleString()}
                          </dd>
                        </div>
                      )}
                      {verificationResult.certificate.workDetails?.workHash && (
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-structural opacity-60">Work Hash</dt>
                          <dd className="mt-1 text-sm text-structural font-mono break-all">
                            {verificationResult.certificate.workDetails.workHash}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                {/* Blockchain Data */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-base border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-structural">Blockchain Information</h3>
                  </div>
                  <div className="px-6 py-6">
                    <dl className="grid grid-cols-1 gap-4">
                      {verificationResult.certificate.tokenId && (
                        <div>
                          <dt className="text-sm font-medium text-structural opacity-60">Token ID</dt>
                          <dd className="mt-1 text-sm text-structural font-mono">
                            {verificationResult.certificate.tokenId}
                          </dd>
                        </div>
                      )}
                      {verificationResult.certificate.transactionHash && (
                        <div>
                          <dt className="text-sm font-medium text-structural opacity-60">Transaction Hash</dt>
                          <dd className="mt-1 text-sm text-structural font-mono break-all">
                            {verificationResult.certificate.transactionHash}
                          </dd>
                        </div>
                      )}
                      {verificationResult.certificate.blockchainData?.currentOwner && (
                        <div>
                          <dt className="text-sm font-medium text-structural opacity-60">Current Owner</dt>
                          <dd className="mt-1 text-sm text-structural font-mono break-all">
                            {verificationResult.certificate.blockchainData.currentOwner}
                          </dd>
                        </div>
                      )}
                      {verificationResult.certificate.blockchainData?.network && (
                        <div>
                          <dt className="text-sm font-medium text-structural opacity-60">Network</dt>
                          <dd className="mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-structural">
                              {verificationResult.certificate.blockchainData.network}
                            </span>
                          </dd>
                        </div>
                      )}
                    </dl>

                    {/* Polygonscan Link */}
                    {verificationResult.polygonscanUrl && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <a
                          href={verificationResult.polygonscanUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-secondary text-white text-sm font-medium rounded-md hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-all"
                        >
                          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View on Polygonscan
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification Checks */}
                {verificationResult.certificate.verification && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-base border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-structural">Verification Checks</h3>
                    </div>
                    <div className="px-6 py-6">
                      <div className="space-y-3">
                        {Object.entries(verificationResult.certificate.verification).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <span className="text-sm text-structural capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              value
                                ? 'bg-primary text-structural'
                                : 'bg-warning text-white'
                            }`}>
                              {value ? (
                                <>
                                  <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Passed
                                </>
                              ) : (
                                <>
                                  <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                  Failed
                                </>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Info Section */}
        {!verificationResult && !error && !isLoading && (
          <div className="bg-white border-2 border-primary rounded-lg p-6">
            <div className="flex items-start">
              <svg className="h-6 w-6 text-secondary mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-structural mb-2">How to Verify</h3>
                <ul className="text-sm text-structural space-y-1 list-disc list-inside">
                  <li>Choose the type of identifier you have</li>
                  <li>Enter the transaction hash, token ID, work hash, or certificate ID</li>
                  <li>Click "Verify" to check the blockchain authenticity</li>
                  <li>View detailed verification results and Polygonscan links</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}