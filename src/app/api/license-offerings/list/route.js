import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req) {
  try {
    const supabase = await createClient();
    const url = new URL(req.url);
    const workId = url.searchParams.get('work_id');

    let query = supabase.from('license_offerings').select('*');
    if (workId) query = query.eq('work_id', workId);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('list license error', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
