'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import PageHeader from '@/components/PageHeader';
import { AlertCircle, Upload } from 'lucide-react';

export default function NewWorkPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const supabase = createClient();

  // Handle work upload
  const handleWorkSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData(e.target);
      if (file) formData.append('file', file);

      const response = await fetch('/api/creative-works/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to upload work');

      // Store upload result and show success screen
      setUploadResult(data);
      setShowSuccess(true);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload work');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        e.target.value = '';
        return;
      }
      setFile(selectedFile);
      setError('');
      
      // Create preview URL for supported file types
      if (selectedFile.type.startsWith('image/')) {
        const objectUrl = URL.createObjectURL(selectedFile);
        setPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
      } else {
        setPreview('');
      }
    }
  };

  return (
    <div className="p-8">
      <PageHeader
        title={showSuccess ? "Work Created Successfully!" : "Create New Work"}
        subtitle={showSuccess ? "Your work has been uploaded and copyright certificate minted" : "Upload your creative work and mint a copyright certificate"}
      />

      {error && (
        <div className="mb-6 max-w-2xl bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* Upload Form */}
      {!showSuccess && (
        <form onSubmit={handleWorkSubmit} className="max-w-2xl space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Work Title</label>
            <input
              type="text"
              name="title"
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
              placeholder="Enter the title of your work"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              rows={4}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
              placeholder="Describe your work..."
            ></textarea>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              name="category"
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            >
              <option value="">Select a category</option>
              <option value="music">Music</option>
              <option value="art">Art</option>
              <option value="video">Video</option>
              <option value="document">Document</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">File</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/90">
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file"
                      type="file"
                      required
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">Up to 50MB</p>
                {file && <p className="text-sm text-green-600 mt-2">Selected: {file.name}</p>}
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {loading ? 'Uploading & Minting...' : 'Upload Work'}
            </button>
          </div>
        </form>
      )}

      {/* Success Screen */}
      {showSuccess && uploadResult && (
        <div className="max-w-2xl space-y-6">
          {/* Success message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Work Uploaded Successfully!
                </h3>
                <p className="text-sm text-green-800 mb-4">
                  Your creative work has been uploaded and saved.
                  {uploadResult.certificate ? (
                    <span> A copyright NFT certificate has been minted on the blockchain!</span>
                  ) : uploadResult.mintingError ? (
                    <span> Copyright certificate minting is in progress (this may take a few moments).</span>
                  ) : null}
                </p>

                {uploadResult.certificate && (
                  <div className="bg-white rounded-md p-4 mb-4 border border-green-100">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Copyright Certificate Details:</p>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Token ID:</span>
                        <span className="font-mono font-semibold">{uploadResult.certificate.tokenId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transaction Hash:</span>
                        <span className="font-mono text-xs truncate max-w-xs">{uploadResult.certificate.transactionHash}</span>
                      </div>
                      {uploadResult.certificate.polygonscanUrl && (
                        <a
                          href={uploadResult.certificate.polygonscanUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline block mt-2"
                        >
                          View on Polygonscan →
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Next steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              What's Next?
            </h3>
            <p className="text-sm text-blue-800 mb-6">
              To allow others to license your work, you need to configure license offerings (pricing, terms, royalty splits).
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => router.push(`/creator/works/${uploadResult.id}/configure`)}
                className="flex-1 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Configure Licensing Now
              </button>
              <button
                onClick={() => router.push('/creator/works')}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Go to My Works
              </button>
            </div>

            <p className="text-xs text-blue-700 mt-4 text-center">
              You can always configure licensing later from your works dashboard.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
