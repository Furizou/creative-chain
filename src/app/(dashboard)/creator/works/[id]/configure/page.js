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
  const [currentUser, setCurrentUser] = useState(null);

  const licenseTemplates = [
    {
      id: 'personal',
      title: 'Personal Use License',
      license_type: 'Personal',
      description: 'Allows personal, non-commercial use of the creative work for individual projects and personal portfolios.',
      price_idr: '50000',
      usage_limit: '',
      duration_days: '',
      terms: `PERSONAL USE LICENSE AGREEMENT

This Personal Use License ("License") is granted by the Creator to the Licensee for the use of the creative work ("Work").

1. GRANT OF LICENSE
The Creator grants the Licensee a non-exclusive, non-transferable license to use the Work for personal, non-commercial purposes only.

2. PERMITTED USES
- Personal projects and hobbies
- Personal portfolio display
- Social media posts for personal accounts
- Educational purposes (non-commercial)
- Personal gifts

3. PROHIBITED USES
- Commercial use of any kind
- Resale or redistribution of the Work
- Use in products for sale
- Corporate or business use
- Mass distribution
- Incorporation into templates or products for sale

4. OWNERSHIP
The Creator retains all ownership rights, including copyright and intellectual property rights to the Work. This License does not transfer ownership.

5. ATTRIBUTION
Attribution to the Creator is appreciated but not required for personal use.

6. WARRANTY DISCLAIMER
THE WORK IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND.

7. TERMINATION
This License is perpetual but may be terminated if terms are violated.

By purchasing this license, you agree to these terms and conditions.`
    },
    {
      id: 'commercial',
      title: 'Standard Commercial License',
      license_type: 'Commercial',
      description: 'Allows commercial use in digital and print projects including websites, apps, marketing materials, and products.',
      price_idr: '200000',
      usage_limit: '',
      duration_days: '365',
      terms: `STANDARD COMMERCIAL LICENSE AGREEMENT

This Commercial License ("License") is granted by the Creator to the Licensee for commercial use of the creative work ("Work").

1. GRANT OF LICENSE
The Creator grants the Licensee a non-exclusive, non-transferable license to use the Work for commercial purposes as outlined in this agreement.

2. PERMITTED USES
- Digital products (websites, applications, software)
- Marketing and advertising materials
- Social media marketing campaigns
- Printed materials (brochures, posters, packaging)
- Products for sale (merchandise, prints) with up to 10,000 units
- Commercial presentations and publications
- Client projects (as a designer/agency)

3. PROHIBITED USES
- Resale or redistribution of the original Work
- Use in competing stock libraries or marketplaces
- Incorporation into logos or trademarks
- Use in defamatory, pornographic, or illegal content
- Mass production exceeding 10,000 units without Extended License

4. DURATION
This License is valid for 365 days from the date of purchase. Renewal required for continued commercial use.

5. ATTRIBUTION
Attribution format: "Created by [Creator Name] via SINAR"
Attribution required in final deliverables or credits section.

6. OWNERSHIP
The Creator retains all ownership rights. The Licensee receives usage rights only.

7. WARRANTY
The Creator warrants that they own the rights to grant this License.

8. LIMITATION OF LIABILITY
The Creator shall not be liable for any indirect, incidental, or consequential damages.

9. TERMINATION
License terminates upon expiration or violation of terms. Upon termination, Licensee must cease all use of the Work.

By purchasing this license, you agree to these terms and conditions.`
    },
    {
      id: 'extended-commercial',
      title: 'Extended Commercial License',
      license_type: 'Extended Commercial',
      description: 'Unlimited commercial use including unlimited product sales, broadcast, and unlimited clients. Perpetual license.',
      price_idr: '500000',
      usage_limit: '',
      duration_days: '',
      terms: `EXTENDED COMMERCIAL LICENSE AGREEMENT

This Extended Commercial License ("License") is granted by the Creator to the Licensee for unlimited commercial use of the creative work ("Work").

1. GRANT OF LICENSE
The Creator grants the Licensee a non-exclusive, non-transferable, perpetual license for unlimited commercial use of the Work.

2. PERMITTED USES
All uses permitted in Standard Commercial License, PLUS:
- Unlimited product sales (no unit limit)
- Broadcast use (TV, streaming, cinema)
- Unlimited client projects
- Use in templates or digital products for resale
- Large-scale marketing campaigns
- Corporate branding materials
- Merchandise with unlimited production runs
- NFT projects and blockchain applications
- Use across multiple brands/companies

3. PROHIBITED USES
- Direct resale or redistribution as a standalone digital asset
- Use in competing creative marketplaces or stock libraries
- Claiming ownership or copyright of the Work
- Use in defamatory, pornographic, or illegal content
- Removal of blockchain verification or certificate references

4. DURATION
This License is perpetual and does not require renewal.

5. ATTRIBUTION
Attribution format: "Created by [Creator Name] via SINAR"
Attribution required in professional/published work credits or descriptions.

6. TRANSFERS
This License may be transferred to clients as part of project deliverables.

7. OWNERSHIP
The Creator retains all ownership and intellectual property rights. The Licensee receives comprehensive usage rights as outlined.

8. BLOCKCHAIN VERIFICATION
This license is verified on the blockchain. The NFT certificate serves as proof of license ownership.

9. WARRANTY
The Creator warrants ownership and the right to grant this License.

10. INDEMNIFICATION
Creator agrees to indemnify Licensee against claims of copyright infringement for proper use under this License.

11. LIMITATION OF LIABILITY
Maximum liability limited to the license purchase price.

12. GOVERNING LAW
This agreement is governed by Indonesian law.

By purchasing this license, you agree to these terms and conditions.`
    },
    {
      id: 'editorial',
      title: 'Editorial Use License',
      license_type: 'Editorial',
      description: 'For use in news, journalism, education, and commentary. Cannot be used for commercial advertising or endorsements.',
      price_idr: '100000',
      usage_limit: '50',
      duration_days: '180',
      terms: `EDITORIAL USE LICENSE AGREEMENT

This Editorial License ("License") is granted by the Creator to the Licensee for editorial use of the creative work ("Work").

1. GRANT OF LICENSE
The Creator grants the Licensee a non-exclusive, non-transferable license to use the Work for editorial purposes only.

2. PERMITTED USES
- News reporting and journalism
- Educational publications and materials
- Documentary films and content
- Blog posts and articles (non-commercial)
- Academic research and publications
- Commentary and criticism
- Historical archives
- Public interest reporting

3. PROHIBITED USES
- Commercial advertising or endorsements
- Promotional materials
- Product packaging
- Marketing campaigns
- Implied endorsement of products/services
- Use suggesting affiliation with brands
- Defamatory or misleading contexts

4. USAGE LIMITATIONS
- Maximum 50 uses within license period
- Each publication, article, or project counts as one use
- Usage tracking required by Licensee

5. DURATION
This License is valid for 180 days from purchase date.

6. ATTRIBUTION
Required format: "Photo/Image by [Creator Name]"
Must include attribution in caption or credit line.

7. MODIFICATIONS
Minor cropping and color correction permitted. Significant alterations that change meaning are prohibited.

8. CONTEXT REQUIREMENTS
Work must be used in factual, newsworthy context. Must not imply endorsement or create false associations.

9. OWNERSHIP
Creator retains all rights. This License grants usage rights only.

10. REPRESENTATION
Licensee represents that use will be for legitimate editorial purposes only.

11. TERMINATION
License terminates upon expiration or violation. Continued use after expiration requires renewal.

By purchasing this license, you agree to these terms and conditions.`
    },
    {
      id: 'social-media',
      title: 'Social Media License',
      license_type: 'Social Media',
      description: 'Optimized for social media content creators. Allows use in posts, stories, and videos on all major platforms.',
      price_idr: '75000',
      usage_limit: '100',
      duration_days: '90',
      terms: `SOCIAL MEDIA LICENSE AGREEMENT

This Social Media License ("License") is granted by the Creator to the Licensee for use of the creative work ("Work") on social media platforms.

1. GRANT OF LICENSE
The Creator grants the Licensee a non-exclusive license to use the Work on social media platforms for content creation.

2. PERMITTED PLATFORMS
- Instagram, Facebook, Twitter/X, TikTok
- YouTube, LinkedIn, Pinterest
- Snapchat, Reddit, Discord
- Other social media and content platforms

3. PERMITTED USES
- Social media posts and stories
- Video content and reels
- Thumbnails and cover images
- Profile and banner images
- Social media advertising (with up to $10,000 ad spend)
- Content creator videos and streams
- Podcast cover art and promotional materials

4. USAGE LIMIT
Maximum 100 posts/uses within license period.
Each post, video, or piece of content counts as one use.

5. DURATION
Valid for 90 days from purchase. Unlimited duration for published content during valid period.

6. MONETIZATION
- YouTube monetization: Permitted
- Sponsored posts: Permitted (with attribution)
- Affiliate marketing: Permitted
- Ad revenue: Permitted

7. ATTRIBUTION
Recommended format: "Design by [Creator Name] @SINAR"
Tag or credit Creator when possible.

8. MODIFICATIONS
Filters, text overlays, and edits permitted to fit platform requirements.

9. PROHIBITED USES
- Reselling or redistributing the Work
- Using in competing creative marketplaces
- Claiming creation or ownership
- Large-scale ad campaigns (>$10,000 spend requires Commercial License)

10. PLATFORM RIGHTS
You grant social media platforms their standard usage rights per their terms of service.

11. TERMINATION
License expires after 90 days or 100 uses, whichever comes first. Content published during valid period may remain live.

By purchasing this license, you agree to these terms and conditions.`
    }
  ];

  useEffect(() => {
    const loadCurrentUser = async () => {
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile with wallet address
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, full_name, wallet_address')
        .eq('id', user.id)
        .single();

      if (profile) {
        setCurrentUser(profile);

        // Only set default royalty split if this is a new license (not edit mode)
        // and if royalty splits haven't been loaded yet
        setForm((f) => {
          if (f.royalty_splits.length === 1 && !f.royalty_splits[0].recipient_address) {
            return {
              ...f,
              royalty_splits: [{
                recipient_address: profile.wallet_address || '',
                recipient_name: profile.username || profile.full_name || 'You',
                split_percentage: '100'
              }]
            };
          }
          return f;
        });
      }
    };

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

    loadCurrentUser();
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

      // Convert empty strings to null for numeric fields
      const formData = {
        work_id: workId,
        license_type: form.license_type,
        title: form.title,
        description: form.description,
        price_idr: form.price_idr ? Number(form.price_idr) : null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        duration_days: form.duration_days ? Number(form.duration_days) : null,
        terms: form.terms,
        royalty_splits: royaltySplitsData
      };

      const res = await fetch("/api/license-offerings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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

      <div className="mb-6">
        <button
          type="button"
          onClick={() => setTemplateOpen(true)}
          className="px-4 py-2 bg-orange-100 text-orange-400 rounded hover:bg-orange-200 font-medium text-sm border border-yellow-200"
        >
          📋 Choose License Template
        </button>
        {templateOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Select License Template</h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose a pre-configured license template to quickly set up your licensing terms. All fields can be customized after selection.
              </p>
              <div className="space-y-3">
                {licenseTemplates.map((t) => (
                  <div key={t.id} className="border border-gray-200 p-4 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-lg mb-1">{t.title}</div>
                        <div className="text-sm text-gray-600 mb-2">{t.description}</div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                            Price: Rp {Number(t.price_idr).toLocaleString('id-ID')}
                          </span>
                          {t.duration_days && (
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                              Duration: {t.duration_days} days
                            </span>
                          )}
                          {!t.duration_days && (
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              Perpetual
                            </span>
                          )}
                          {t.usage_limit && (
                            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">
                              Limit: {t.usage_limit} uses
                            </span>
                          )}
                          {!t.usage_limit && (
                            <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                              Unlimited uses
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setForm((f) => ({
                            ...f,
                            license_type: t.license_type,
                            title: t.title,
                            description: t.description,
                            price_idr: t.price_idr,
                            usage_limit: t.usage_limit,
                            duration_days: t.duration_days,
                            terms: t.terms
                          }));
                          setTemplateOpen(false);
                        }}
                        className="ml-4 px-4 py-2 bg-primary text-structural rounded hover:opacity-80 whitespace-nowrap"
                      >
                        Use Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setTemplateOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
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
            className="border border-gray-300 p-2 w-full rounded focus:ring-2 focus:ring-primary focus:border-transparent"
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
            className="border border-gray-300 p-2 w-full rounded focus:ring-2 focus:ring-primary focus:border-transparent"
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
            className="border border-gray-300 p-2 w-full rounded focus:ring-2 focus:ring-primary focus:border-transparent"
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
            className="border border-gray-300 p-2 w-full rounded focus:ring-2 focus:ring-primary focus:border-transparent"
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
            className="border border-gray-300 p-2 w-full rounded focus:ring-2 focus:ring-primary focus:border-transparent"
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
            className="border border-gray-300 p-2 w-full rounded focus:ring-2 focus:ring-primary focus:border-transparent"
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
            className="border border-gray-300 p-2 w-full rounded focus:ring-2 focus:ring-primary focus:border-transparent"
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
                    className="w-full text-left border border-gray-300 p-2 rounded bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:border-transparent"
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
                          className="border border-gray-300 p-2 w-full rounded mb-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                          autoFocus
                        />

                        <div className="space-y-2 mb-4">
                          {searchResults.length > 0 ? (
                            searchResults.map((user) => (
                              <div
                                key={user.id}
                                className="border border-gray-200 p-3 rounded hover:bg-yellow-50 cursor-pointer"
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
                  className="border border-gray-300 p-2 w-full rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addRoyaltySplit}
            className="text-orange-400 text-sm hover:underline font-medium"
          >
            + Add Another Split
          </button>

          {/* Show total percentage */}
          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded">
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
          className="bg-primary text-structural px-4 py-2 rounded"
        >
          {loading ? "Saving..." : "Save Configuration"}
        </button>

        {message && <p className="mt-4">{message}</p>}
      </form>
    </div>
  );
}
