import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase/client';

export async function POST(req) {
  try {
    const body = await req.json();
    const { work_id, splits } = body;
    if (!work_id || !Array.isArray(splits)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // basic validation: sum must be 100
    const total = splits.reduce((s, r) => s + Number(r.split_percentage || 0), 0);
    if (Math.round(total) !== 100) {
      return NextResponse.json({ error: 'Split percentages must sum to 100' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // delete existing splits for work_id
    const { error: delErr } = await supabase.from('royalty_splits').delete().eq('work_id', work_id);
    if (delErr) throw delErr;

    const payload = splits.map((r) => ({
      id: uuidv4(),
      work_id,
      recipient_address: r.recipient_address,
      split_percentage: r.split_percentage,
      split_contract_address: r.split_contract_address ?? null,
      created_at: now,
    }));

    const { error: insertErr } = await supabase.from('royalty_splits').insert(payload);
    if (insertErr) throw insertErr;

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('configure splits error', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
