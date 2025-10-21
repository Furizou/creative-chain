"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from '@/hooks/useAuth';
import { Music, Palette, Camera, FileText } from 'lucide-react';
import { isImageUrl, getCategoryIcon } from '@/lib/utils/fileUtils';

export default function WorkDetailPage() {
  const { id: workId } = useParams();
  const router = useRouter();

  const [work, setWork] = useState(null);
  const [licenses, setLicenses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [buyingLicense, setBuyingLicense] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchWorkDetails = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch work details
        const { data: workData, error: workError } = await supabase
          .from("creative_works")
          .select(`
            *,
            creator:profiles(*)
          `)
          .eq("id", workId)
          .single();

        if (workError) throw workError;
        setWork(workData);

        // Fetch license offerings
        const { data: licenseData, error: licenseError } = await supabase
          .from("license_offerings")
          .select("*")
          .eq("work_id", workId)
          .eq("is_active", true);

        if (licenseError) throw licenseError;
        setLicenses(licenseData || []);

        // Fetch transactions (licenses sold)
        const { data: txData, error: txError } = await supabase
          .from("licenses")
          .select(`
            *,
            buyer:profiles(*)
          `)
          .eq("work_id", workId)
          .order("purchased_at", { ascending: false });

        if (txError) throw txError;
        setTransactions(txData || []);

      } catch (err) {
        console.error("Error fetching work details:", err);
        setError("Failed to load work details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (workId) {
      fetchWorkDetails();
    }
  }, [workId]);

  const handleBuyLicense = async (license) => {
    try {
      setBuyingLicense(true);
      setSelectedLicense(license);

      // Create order
  const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            license_offering_id: license.id,
    buyer_id: user?.id,
            amount_idr: license.price_idr,
            amount_bidr: license.price_bidr,
            payment_method: "mock_gateway",
            status: "pending"
          }
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Redirect to payment/checkout
      router.push(`/checkout/${order.id}`);

    } catch (err) {
      console.error("Error initiating purchase:", err);
      setError("Failed to initiate purchase. Please try again.");
    } finally {
      setBuyingLicense(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <p>Loading work details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-600 hover:underline"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="container mx-auto p-8">
        <p>Work not found.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-600 hover:underline"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  const isImage = isImageUrl(work?.file_url);
  const iconName = getCategoryIcon(work?.category);

  // Map icon names to components
  const iconComponents = {
    Music,
    Palette,
    Camera,
    FileText
  };

  const IconComponent = iconComponents[iconName] || FileText;

  return (
    <div className="container mx-auto p-8">
      {/* Work Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          {work.file_url && (
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              {isImage ? (
                <img
                  src={work.file_url}
                  alt={work.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <IconComponent className="w-24 h-24 text-gray-400" />
              )}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-4">{work.title}</h1>
          
          <div className="mb-4">
            <p className="text-gray-600">{work.description}</p>
          </div>

          <div className="mb-6">
            <h2 className="font-semibold mb-2">Creator</h2>
            <div className="flex items-center">
              {work.creator?.avatar_url && (
                <img
                  src={work.creator.avatar_url}
                  alt={work.creator.username}
                  className="w-10 h-10 rounded-full mr-3"
                />
              )}
              <div>
                <div className="font-medium">{work.creator?.full_name}</div>
                <div className="text-sm text-gray-500">@{work.creator?.username}</div>
              </div>
            </div>
          </div>

          {/* License Options */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Licenses</h2>
            <div className="space-y-4">
              {licenses.map((license) => (
                <div
                  key={license.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{license.title}</h3>
                      <p className="text-sm text-gray-600">{license.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        IDR {license.price_idr?.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {license.price_bidr?.toLocaleString()} BIDR
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-4">
                    {license.usage_limit && (
                      <div>Usage limit: {license.usage_limit}</div>
                    )}
                    {license.duration_days && (
                      <div>Duration: {license.duration_days} days</div>
                    )}
                  </div>

                  <button
                    onClick={() => handleBuyLicense(license)}
                    disabled={buyingLicense}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {buyingLicense && selectedLicense?.id === license.id
                      ? "Processing..."
                      : "Buy License"}
                  </button>
                </div>
              ))}

              {licenses.length === 0 && (
                <p className="text-gray-600">No licenses available.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">License Transaction History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Buyer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tx.purchased_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {tx.buyer?.avatar_url && (
                        <img
                          src={tx.buyer.avatar_url}
                          alt=""
                          className="w-6 h-6 rounded-full mr-2"
                        />
                      )}
                      <div className="text-sm font-medium text-gray-900">
                        {tx.buyer?.username}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tx.license_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tx.price_usdt} USDT
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tx.transaction_hash && (
                      <a
                        href={`https://polygonscan.com/tx/${tx.transaction_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </a>
                    )}
                  </td>
                </tr>
              ))}

              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
