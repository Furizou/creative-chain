import { supabase } from '@/lib/supabase/client';
import { notFound } from 'next/navigation';

/**
 * Server Component to display creative work details
 * @param {Object} props - Component props
 * @param {Object} props.params - Dynamic route parameters
 * @param {string} props.params.id - Work ID from the URL
 * @returns {Promise<JSX.Element>} Work details page
 */
export default async function WorkDetailsPage({ params }) {
  const { id } = await params;

  try {
    // Fetch work details from the database
    const { data: work, error } = await supabase
      .from('creative_works')
      .select('*')
      .eq('id', id)
      .single();

    // Handle database errors
    if (error) {
      console.error('Error fetching work:', error);
      if (error.code === 'PGRST116') {
        // No rows returned
        notFound();
      }
      throw error;
    }

    // Handle case where work is not found
    if (!work) {
      notFound();
    }

    // Check if the file is an image based on file extension
    const isImage = work.file_url && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(work.file_url);

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {work.title}
              </h1>
              
              {/* Category Badge */}
              <div className="mb-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {work.category}
                </span>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {work.description || 'No description provided.'}
                </p>
              </div>

              {/* File Display */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">File</h2>
                {work.file_url ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {isImage ? (
                      <div className="relative">
                        <img
                          src={work.file_url}
                          alt={work.title}
                          className="w-full h-auto max-h-96 object-contain bg-gray-50"
                        />
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <div className="mb-4">
                          <svg
                            className="mx-auto h-16 w-16 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-700 mb-4">
                          File: {work.original_filename || 'Unknown filename'}
                        </p>
                        <a
                          href={work.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg
                            className="mr-2 h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Download File
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                    No file associated with this work.
                  </div>
                )}
              </div>

              {/* Certificate Status */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Certificate Status</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg
                      className="h-5 w-5 text-yellow-400 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-yellow-800 font-medium">
                      Certificate Status: Not Yet Minted
                    </span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-2">
                    This work has not yet been minted as a blockchain certificate.
                  </p>
                </div>
              </div>

              {/* Metadata */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">File Hash</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono break-all">
                      {work.file_hash || 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">File Size</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {work.file_size ? `${(work.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Upload Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {work.created_at ? new Date(work.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Original Filename</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {work.original_filename || 'N/A'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-6">
            Unable to load work details. Please try again later.
          </p>
          <a
            href="/upload"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Upload
          </a>
        </div>
      </div>
    );
  }
}

/**
 * Generate metadata for the page
 * @param {Object} props - Component props
 * @param {Object} props.params - Dynamic route parameters
 * @returns {Promise<Object>} Page metadata
 */
export async function generateMetadata({ params }) {
  const { id } = await params;
  
  try {
    const { data: work } = await supabase
      .from('creative_works')
      .select('title, description')
      .eq('id', id)
      .single();

    if (work) {
      return {
        title: `${work.title} | Creative Chain`,
        description: work.description || 'View creative work details',
      };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }

  return {
    title: 'Work Details | Creative Chain',
    description: 'View creative work details',
  };
}