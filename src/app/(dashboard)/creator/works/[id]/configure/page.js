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
    price_bidr: "",
    usage_limit: "",
    duration_days: "",
    terms: "",
    royalty_splits: [{ recipient_address: "", split_percentage: "" }],
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [prefetching, setPrefetching] = useState(true);
  const [error, setError] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  const licenseTemplates = [
    { id: 'personal', title: 'Personal Use', license_type: 'Personal', terms: 'Personal use only.' },
    { id: 'commercial', title: 'Commercial Use', license_type: 'Commercial', terms: 'Commercial use allowed.' },
  ];

  useEffect(() => {
    const loadWork = async () => {
      if (!workId) return setPrefetching(false);
      setPrefetching(true);
      const { data, error: fetchErr } = await supabase
        .from("works")
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
          price_bidr: lic.price_bidr || '',
          usage_limit: lic.usage_limit || '',
          duration_days: lic.duration_days || '',
          terms: lic.terms || '',
        }));
        // load splits
        const { data: splits } = await supabase.from('royalty_splits').select('*').eq('work_id', workId);
        if (splits && splits.length) {
          setForm((f) => ({ ...f, royalty_splits: splits.map(s => ({ recipient_address: s.recipient_address, split_percentage: String(s.split_percentage) })) }));
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
      royalty_splits: [...form.royalty_splits, { recipient_address: "", split_percentage: "" }],
    });
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
      if (!ethRegex.test(s.recipient_address)) {
        setError('Invalid wallet address: ' + s.recipient_address);
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/license-offerings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ work_id: workId, ...form, royalty_splits: form.royalty_splits }),
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="license_type"
          placeholder="License Type"
          value={form.license_type}
          onChange={handleChange}
          className="border p-2 w-full rounded"
          required
        />
        <input
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          className="border p-2 w-full rounded"
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="border p-2 w-full rounded"
          rows="3"
        />
        <input
          name="price_idr"
          placeholder="Price (IDR)"
          value={form.price_idr}
          onChange={handleChange}
          className="border p-2 w-full rounded"
          type="number"
        />
        <input
          name="price_bidr"
          placeholder="Price (BIDR)"
          value={form.price_bidr}
          onChange={handleChange}
          className="border p-2 w-full rounded"
          type="number"
        />
        <input
          name="usage_limit"
          placeholder="Usage Limit"
          value={form.usage_limit}
          onChange={handleChange}
          className="border p-2 w-full rounded"
          type="number"
        />
        <input
          name="duration_days"
          placeholder="Duration (days)"
          value={form.duration_days}
          onChange={handleChange}
          className="border p-2 w-full rounded"
          type="number"
        />
        <textarea
          name="terms"
          placeholder="Terms"
          value={form.terms}
          onChange={handleChange}
          className="border p-2 w-full rounded"
          rows="3"
        />

        <div>
          <h2 className="font-semibold mb-2">Royalty Splits</h2>
          {form.royalty_splits.map((split, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input
                name="recipient_address"
                placeholder="Recipient Address"
                value={split.recipient_address}
                onChange={(e) => handleRoyaltyChange(idx, e)}
                className="border p-2 flex-1 rounded"
                required
              />
              <input
                name="split_percentage"
                placeholder="%"
                type="number"
                value={split.split_percentage}
                onChange={(e) => handleRoyaltyChange(idx, e)}
                className="border p-2 w-20 rounded"
                required
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addRoyaltySplit}
            className="text-blue-600 text-sm hover:underline"
          >
            ➕ Add Split
          </button>
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
