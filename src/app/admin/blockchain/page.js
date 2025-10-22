'use client';

import { useState, useEffect } from 'react';
import { getContractAddresses } from '@/lib/blockchain';

export default function BlockchainAdminDashboard() {
  const [stats, setStats] = useState({
    copyrightSupply: 0,
    licenseSupply: 0
  });
  const [certificates, setCertificates] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('certificates'); // 'certificates' or 'licenses'

  const contractAddresses = getContractAddresses();

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);

      // Fetch blockchain stats and NFT data in parallel
      const [copyrightRes, licenseRes, nftsRes] = await Promise.all([
        fetch('/api/blockchain/stats?type=copyright'),
        fetch('/api/blockchain/stats?type=license'),
        fetch('/api/admin/blockchain/nfts')
      ]);

      const copyrightData = await copyrightRes.json();
      const licenseData = await licenseRes.json();
      const nftsData = await nftsRes.json();

      if (nftsData.success) {
        setCertificates(nftsData.certificates || []);
        setLicenses(nftsData.licenses || []);
      } else {
        console.error('Error fetching NFTs:', nftsData.error);
      }

      setStats({
        copyrightSupply: copyrightData.totalSupply || 0,
        licenseSupply: licenseData.totalSupply || 0
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  // Filter function for search
  const filterItems = (items, type) => {
    if (!searchTerm) return items;

    const term = searchTerm.toLowerCase();
    return items.filter(item => {
      const tokenId = (item.token_id || item.nft_token_id || '').toLowerCase();
      const txHash = (item.transaction_hash || item.nft_transaction_hash || '').toLowerCase();
      const walletAddress = (item.wallet_address || '').toLowerCase();
      const workTitle = item.creative_works?.title?.toLowerCase() || '';
      const username = item.profiles?.username?.toLowerCase() || '';
      const fullName = item.profiles?.full_name?.toLowerCase() || '';

      return tokenId.includes(term) ||
             txHash.includes(term) ||
             walletAddress.includes(term) ||
             workTitle.includes(term) ||
             username.includes(term) ||
             fullName.includes(term);
    });
  };

  const filteredCertificates = filterItems(certificates, 'certificates');
  const filteredLicenses = filterItems(licenses, 'licenses');

  if (loading) {
    return (
      <div className="min-h-screen bg-base p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-structural mb-8">Blockchain Admin Dashboard</h1>
          <p className="text-structural">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-structural mb-8">Blockchain Admin Dashboard</h1>

        {/* Contract Addresses Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
          <h2 className="text-xl font-semibold text-structural mb-4">Smart Contract Addresses</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-base rounded">
              <span className="font-medium text-structural">Copyright NFT Contract:</span>
              <a
                href={`https://amoy.polygonscan.com/address/${contractAddresses.COPYRIGHT}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary hover:text-warning font-mono text-sm transition-colors"
              >
                {contractAddresses.COPYRIGHT}
              </a>
            </div>
            <div className="flex justify-between items-center p-3 bg-base rounded">
              <span className="font-medium text-structural">License NFT Contract:</span>
              <a
                href={`https://amoy.polygonscan.com/address/${contractAddresses.LICENSE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary hover:text-warning font-mono text-sm transition-colors"
              >
                {contractAddresses.LICENSE}
              </a>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatCard
            title="Copyright Certificates"
            value={stats.copyrightSupply}
            subtitle="Total minted on blockchain"
            icon="📜"
          />
          <StatCard
            title="License NFTs"
            value={stats.licenseSupply}
            subtitle="Total minted on blockchain"
            icon="🎫"
          />
        </div>

        {/* NFTs List Section */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-xl font-semibold text-structural">All Minted NFTs</h2>

            {/* Search Bar */}
            <div className="w-full md:w-96">
              <input
                type="text"
                placeholder="Search by token ID, tx hash, wallet, title, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-structural"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <TabButton
              active={activeTab === 'certificates'}
              onClick={() => setActiveTab('certificates')}
              count={filteredCertificates.length}
            >
              Copyright Certificates
            </TabButton>
            <TabButton
              active={activeTab === 'licenses'}
              onClick={() => setActiveTab('licenses')}
              count={filteredLicenses.length}
            >
              License NFTs
            </TabButton>
          </div>

          {/* Table Content */}
          {activeTab === 'certificates' ? (
            <CertificatesTable certificates={filteredCertificates} />
          ) : (
            <LicensesTable licenses={filteredLicenses} />
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-structural">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-structural">{value.toLocaleString()}</p>
      <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
    </div>
  );
}

function TabButton({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium transition-colors border-b-2 ${
        active
          ? 'border-primary text-structural'
          : 'border-transparent text-gray-600 hover:text-structural'
      }`}
    >
      {children} ({count})
    </button>
  );
}

function CertificatesTable({ certificates }) {
  if (certificates.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        No copyright certificates found
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-base">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-structural uppercase">
              Token ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-structural uppercase">
              Work Title
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-structural uppercase">
              Category
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-structural uppercase">
              Owner
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-structural uppercase">
              Wallet
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-structural uppercase">
              Minted
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-structural uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {certificates.map((cert) => (
            <tr key={cert.id} className="hover:bg-base transition-colors">
              <td className="px-4 py-4 text-sm font-mono text-structural">
                #{cert.token_id}
              </td>
              <td className="px-4 py-4 text-sm text-structural">
                {cert.creative_works?.title || 'N/A'}
              </td>
              <td className="px-4 py-4 text-sm">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-structural">
                  {cert.creative_works?.category || 'N/A'}
                </span>
              </td>
              <td className="px-4 py-4 text-sm text-structural">
                {cert.profiles?.username || cert.profiles?.full_name || 'Unknown'}
              </td>
              <td className="px-4 py-4 text-sm font-mono text-gray-600">
                {shortenAddress(cert.wallet_address)}
              </td>
              <td className="px-4 py-4 text-sm text-gray-600">
                {new Date(cert.minted_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-4 text-sm">
                <a
                  href={`https://amoy.polygonscan.com/tx/${cert.transaction_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary hover:text-warning font-medium transition-colors"
                >
                  View TX
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LicensesTable({ licenses }) {
  if (licenses.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        No license NFTs found
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-base">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-structural uppercase">
              Token ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-structural uppercase">
              Work Title
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-structural uppercase">
              License Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-structural uppercase">
              Buyer
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-structural uppercase">
              Price (BIDR)
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-structural uppercase">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-structural uppercase">
              Purchased
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-structural uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {licenses.map((license) => (
            <tr key={license.id} className="hover:bg-base transition-colors">
              <td className="px-4 py-4 text-sm font-mono text-structural">
                #{license.nft_token_id || 'N/A'}
              </td>
              <td className="px-4 py-4 text-sm text-structural">
                {license.creative_works?.title || 'N/A'}
              </td>
              <td className="px-4 py-4 text-sm">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-white">
                  {formatLicenseType(license.license_type)}
                </span>
              </td>
              <td className="px-4 py-4 text-sm text-structural">
                {license.profiles?.username || license.profiles?.full_name || 'Unknown'}
              </td>
              <td className="px-4 py-4 text-sm text-structural">
                {formatPrice(license.price_bidr)}
              </td>
              <td className="px-4 py-4 text-sm">
                {license.is_valid ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Valid
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Expired
                  </span>
                )}
              </td>
              <td className="px-4 py-4 text-sm text-gray-600">
                {new Date(license.purchased_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-4 text-sm">
                {license.nft_transaction_hash ? (
                  <a
                    href={`https://amoy.polygonscan.com/tx/${license.nft_transaction_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary hover:text-warning font-medium transition-colors"
                  >
                    View TX
                  </a>
                ) : (
                  <span className="text-gray-400">No TX</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Helper functions
function shortenAddress(address) {
  if (!address) return 'N/A';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatLicenseType(type) {
  if (!type) return 'N/A';
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatPrice(price) {
  if (!price) return 'N/A';
  return new Intl.NumberFormat('id-ID').format(price);
}
