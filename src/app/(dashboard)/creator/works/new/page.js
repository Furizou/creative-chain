'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import PageHeader from '@/components/PageHeader';
import { AlertCircle, Upload } from 'lucide-react';

export default function NewWorkPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const supabase = createClientComponentClient();

  const handleSubmit = async (e) => {
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

      router.push('/creator/my-works');
      router.refresh();
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
        title="Create New Work" 
        subtitle="Upload your creative work and set up licensing options" 
      />

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Title */}
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

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            rows={4}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            placeholder="Describe your work..."
          ></textarea>
        </div>

        {/* Category */}
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

        {/* File Upload */}
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
            </div>
          </div>
        </div>

        {/* Submit */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload Work'}
          </button>
        </div>
      </form>
    </div>
  );
}
