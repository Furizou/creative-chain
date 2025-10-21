'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Create a single instance of the Supabase client for client components
const supabase = createClientComponentClient();

export default supabase;
