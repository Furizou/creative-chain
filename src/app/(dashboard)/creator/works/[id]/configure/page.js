"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function ConfigureLicensePage() {
  const { id: workId } = useParams();
  const router = useRouter();

  const [form, setForm] = useState({
    license_type: "",
    title: "",
    description: "",
    price_idr: "",
    usage_limit: "",
    duration_days: "",
    terms: "",
    royalty_splits: [{ recipient_address: "", recipient_name: "", split_percentage: "" }],
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [prefetching, setPrefetching] = useState(true);
  const [error, setError] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [userSearchOpen, setUserSearchOpen] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const licenseTemplates = [
    { id: 'personal', title: 'Personal Use', license_type: 'Personal', terms: 'Personal use only.' },
    { id: 'commercial', title: 'Commercial Use', license_type: 'Commercial', terms: 'Commercial use allowed.' },
  ];

  useEffect(() => {
    const loadWork = async () => {
      if (!workId) return setPrefetching(false);
      setPrefetching(true);
      const { data, error: fetchErr } = await supabase
        .from("creative_works")
        .select("*")
        .eq("id", workId)
        .single();

      if (fetchErr) {
        console.error("Error fetching work:", fetchErr);
        setError("Failed to load work data.");
        setPrefetching(false);
        return;
      }

      if (data) {
        setForm((f) => ({
          ...f,
          title: data.title || "",
          description: data.description || "",
        }));
      }

      setPrefetching(false);
    };

    const loadExistingLicense = async () => {
      if (!workId) return;
      const res = await fetch(`/api/license-offerings/list?work_id=${workId}`);
      const payload = await res.json();
      if (res.ok && payload.data && payload.data.length > 0) {
        const lic = payload.data[0];
        setForm((f) => ({
          ...f,
          license_type: lic.license_type || '',
          title: lic.title || '',
          description: lic.description || '',
          price_idr: lic.price_idr || '',
          usage_limit: lic.usage_limit || '',
          duration_days: lic.duration_days || '',
          terms: lic.terms || '',
        }));
        // load splits with profile info
        const { data: splits } = await supabase
          .from('royalty_splits')
          .select('*, profiles:recipient_address(username, full_name, wallet_address)')
          .eq('work_id', workId);
        if (splits && splits.length) {
          setForm((f) => ({
            ...f,
            royalty_splits: splits.map(s => ({
              recipient_address: s.recipient_address,
              recipient_name: s.profiles?.username || s.profiles?.full_name || 'Unknown User',
              split_percentage: String(s.split_percentage)
            }))
          }));
        }
        setIsEditMode(true);
      }
    };

    loadExistingLicense();

    loadWork();
  }, [workId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoyaltyChange = (index, e) => {
    const updatedSplits = [...form.royalty_splits];
    updatedSplits[index][e.target.name] = e.target.value;
    setForm({ ...form, royalty_splits: updatedSplits });
  };

  const addRoyaltySplit = () => {
    setForm({
      ...form,
      royalty_splits: [...form.royalty_splits, { recipient_address: "", recipient_name: "", split_percentage: "" }],
    });
  };

  const removeRoyaltySplit = (index) => {
    const updatedSplits = form.royalty_splits.filter((_, i) => i !== index);
    setForm({ ...form, royalty_splits: updatedSplits });
  };

  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, wallet_address')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(10);

    if (!error && data) {
      setSearchResults(data);
    }
  };

  const selectUser = (index, user) => {
    const updatedSplits = [...form.royalty_splits];
    updatedSplits[index] = {
      ...updatedSplits[index],
      recipient_address: user.wallet_address || '',
      recipient_name: user.username || user.full_name || 'Unknown User',
    };
    setForm({ ...form, royalty_splits: updatedSplits });
    setUserSearchOpen(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    // validate royalty sum
    const total = form.royalty_splits.reduce((s, r) => s + Number(r.split_percentage || 0), 0);
    if (Math.round(total) !== 100) {
      setError('Royalty percentages must sum to 100%');
      setLoading(false);
      return;
    }

    // basic wallet address validation (ethereum-like)
    const ethRegex = /^0x[a-fA-F0-9]{40}$/;
    for (const s of form.royalty_splits) {
      if (!s.recipient_address) {
        setError('Please select a recipient for all royalty splits');
        setLoading(false);
        return;
      }
      if (!ethRegex.test(s.recipient_address)) {
        setError('Invalid wallet address: ' + s.recipient_address);
        setLoading(false);
        return;
      }
    }

    try {
      // Prepare data with only recipient_address for backend
      const royaltySplitsData = form.royalty_splits.map(s => ({
        recipient_address: s.recipient_address,
        split_percentage: s.split_percentage
      }));

      const res = await fetch("/api/license-offerings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          work_id: workId,
          ...form,
          royalty_splits: royaltySplitsData
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save configuration");

      setMessage("✅ Configuration saved successfully!");
      setTimeout(() => router.push("/creator/my-works"), 1500);
    } catch (err) {
      console.error(err);
      setMessage("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">⚙️ Configure License</h1>

      {prefetching && <p className="p-4">Loading work data...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="mb-4">
        <button type="button" onClick={() => setTemplateOpen(true)} className="text-sm text-blue-600 hover:underline">Choose template</button>
        {templateOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-6 rounded max-w-md w-full">
              <h3 className="font-bold mb-3">Select License Template</h3>
              <div className="space-y-2">
                {licenseTemplates.map((t) => (
                  <div key={t.id} className="flex items-center justify-between border p-2 rounded">
                    <div>
                      <div className="font-semibold">{t.title}</div>
                      <div className="text-sm text-gray-600">{t.terms}</div>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setForm((f) => ({ ...f, license_type: t.license_type, terms: t.terms }));
                          setTemplateOpen(false);
                        }}
                        className="text-blue-600"
                      >
                        Use
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-right">
                <button type="button" onClick={() => setTemplateOpen(false)} className="text-sm text-gray-600">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* License Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            License Type <span className="text-red-500">*</span>
          </label>
          <input
            name="license_type"
            placeholder="e.g., Personal, Commercial, Editorial"
            value={form.license_type}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Specify the type of license (e.g., Personal Use, Commercial Use, Editorial)
          </p>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            License Title <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            placeholder="e.g., Standard Commercial License"
            value={form.title}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            A clear, descriptive title for this license offering
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            placeholder="Describe what this license includes and any restrictions..."
            value={form.description}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="3"
          />
          <p className="text-xs text-gray-500 mt-1">
            Detailed description of what buyers get with this license
          </p>
        </div>

        {/* Price (IDR) - Single field */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Price (IDR) <span className="text-red-500">*</span>
          </label>
          <input
            name="price_idr"
            placeholder="e.g., 50000"
            value={form.price_idr}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            type="number"
            min="0"
            step="1"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Price in Indonesian Rupiah. BIDR equivalent will be calculated automatically (1:1)
          </p>
        </div>

        {/* Usage Limit */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Usage Limit
          </label>
          <input
            name="usage_limit"
            placeholder="e.g., 100 (leave empty for unlimited)"
            value={form.usage_limit}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            type="number"
            min="0"
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum number of times the license can be used. Leave empty for unlimited usage
          </p>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Duration (Days)
          </label>
          <input
            name="duration_days"
            placeholder="e.g., 365 (leave empty for perpetual)"
            value={form.duration_days}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            type="number"
            min="1"
          />
          <p className="text-xs text-gray-500 mt-1">
            How many days the license is valid for. Leave empty for perpetual licenses
          </p>
        </div>

        {/* Terms */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Terms & Conditions
          </label>
          <textarea
            name="terms"
            placeholder="Enter the legal terms and conditions for this license..."
            value={form.terms}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="4"
          />
          <p className="text-xs text-gray-500 mt-1">
            Legal terms and conditions that buyers must agree to
          </p>
        </div>

        {/* Royalty Splits */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Royalty Splits <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Define how royalties will be split between recipients. Total must equal 100%
          </p>

          {form.royalty_splits.map((split, idx) => (
            <div key={idx} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">Split #{idx + 1}</span>
                {form.royalty_splits.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRoyaltySplit(idx)}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Recipient Search */}
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Recipient
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setUserSearchOpen(idx);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="w-full text-left border border-gray-300 p-2 rounded bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {split.recipient_name || split.recipient_address || "Click to select a user..."}
                  </button>

                  {/* Search Modal */}
                  {userSearchOpen === idx && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <h3 className="font-bold mb-3">Search User</h3>

                        <input
                          type="text"
                          placeholder="Search by username or name..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            searchUsers(e.target.value);
                          }}
                          className="border border-gray-300 p-2 w-full rounded mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                        />

                        <div className="space-y-2 mb-4">
                          {searchResults.length > 0 ? (
                            searchResults.map((user) => (
                              <div
                                key={user.id}
                                className="border border-gray-200 p-3 rounded hover:bg-blue-50 cursor-pointer"
                                onClick={() => selectUser(idx, user)}
                              >
                                <div className="font-semibold text-sm">
                                  {user.username || user.full_name || 'Unknown User'}
                                </div>
                                {user.full_name && user.username && (
                                  <div className="text-xs text-gray-600">{user.full_name}</div>
                                )}
                                <div className="text-xs text-gray-500 truncate mt-1">
                                  {user.wallet_address || 'No wallet address'}
                                </div>
                              </div>
                            ))
                          ) : searchQuery.length >= 2 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No users found</p>
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">
                              Type at least 2 characters to search
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setUserSearchOpen(null);
                              setSearchQuery("");
                              setSearchResults([]);
                            }}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {split.recipient_address && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    Wallet: {split.recipient_address}
                  </p>
                )}
              </div>

              {/* Split Percentage */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Percentage (%)
                </label>
                <input
                  name="split_percentage"
                  placeholder="e.g., 50"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={split.split_percentage}
                  onChange={(e) => handleRoyaltyChange(idx, e)}
                  className="border border-gray-300 p-2 w-full rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addRoyaltySplit}
            className="text-blue-600 text-sm hover:underline font-medium"
          >
            + Add Another Split
          </button>

          {/* Show total percentage */}
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Percentage:</span>
              <span className={`text-sm font-bold ${
                Math.round(form.royalty_splits.reduce((s, r) => s + Number(r.split_percentage || 0), 0)) === 100
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {form.royalty_splits.reduce((s, r) => s + Number(r.split_percentage || 0), 0).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Saving..." : "Save Configuration"}
        </button>

        {message && <p className="mt-4">{message}</p>}
      </form>
    </div>
  );
}
