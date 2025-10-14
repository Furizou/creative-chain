// API route for authentication
import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase/client';

export async function POST(request) {
  const { email, password, type } = await request.json();

  try {
    if (type === 'signin') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      return NextResponse.json({ user: data.user });
    } else if (type === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      return NextResponse.json({ user: data.user });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}