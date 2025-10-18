import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase/client';

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      work_id,
      license_type,
      title,
      description,
      price_idr,
      price_bidr,
      usage_limit,
      duration_days,
      terms,
  royalty_splits,
    } = body;

    // simple validation
    if (!work_id || !license_type || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // check if a license already exists for this work
    const { data: existing, error: existingErr } = await supabase
      .from('license_offerings')
      .select('*')
      .eq('work_id', work_id)
      .single();

    if (existingErr && existingErr.code !== 'PGRST116') {
      // PGRST116 used by supabase when no rows found for single()
      // If other error, throw
      console.warn('existing check warning', existingErr.message || existingErr);
    }

    let data;

    if (existing && existing.id) {
      // update existing
      const { data: updated, error: updateErr } = await supabase
        .from('license_offerings')
        .update({
          license_type,
          title,
          description: description ?? null,
          price_idr: price_idr ?? null,
          price_bidr: price_bidr ?? null,
          usage_limit: usage_limit ?? null,
          duration_days: duration_days ?? null,
          terms: terms ?? null,
          updated_at: now,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      data = updated;
    } else {
      const { data: inserted, error: insertErr } = await supabase.from('license_offerings').insert([
        {
          id: uuidv4(),
          work_id,
          license_type,
          title,
          description: description ?? null,
          price_idr: price_idr ?? null,
          price_bidr: price_bidr ?? null,
          usage_limit: usage_limit ?? null,
          duration_days: duration_days ?? null,
          terms: terms ?? null,
          is_active: true,
          created_at: now,
          updated_at: now,
        },
      ]).select().single();

      if (insertErr) throw insertErr;
      data = inserted;
    }

    // optionally handle royalty splits from payload (replace existing)
  if (royalty_splits && royalty_splits.length > 0) {
      // delete existing splits for work
      const { error: delErr } = await supabase.from('royalty_splits').delete().eq('work_id', work_id);
      if (delErr) throw delErr;

  const splits = royalty_splits.map((s) => ({
        id: uuidv4(),
        work_id,
        recipient_address: s.recipient_address,
        split_percentage: s.split_percentage,
        split_contract_address: s.split_contract_address ?? null,
        created_at: now,
      }));
      const { error: splitErr } = await supabase.from('royalty_splits').insert(splits);
      if (splitErr) throw splitErr;
    }

    return NextResponse.json({ success: true, license: data }, { status: 201 });
  } catch (err) {
    console.error('create license error', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
