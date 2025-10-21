import { supabase } from '@/lib/supabase/client';

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

/**
 * Layout component for individual work pages
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @returns {JSX.Element} Layout wrapper
 */
export default function WorkLayout({ children }) {
  return <>{children}</>;
}