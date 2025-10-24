import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/server';

export async function POST(req) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const {
      work_id,
      license_type,
      title,
      description,
      price_idr,
      usage_limit,
      duration_days,
      terms,
      royalty_splits,
    } = body;

    // simple validation
    if (!work_id || !license_type || !title) {
      return NextResponse.json({ error: 'Missing required fields: work_id, license_type, and title are required' }, { status: 400 });
    }

    // Validate price_idr (required field in database)
    if (!price_idr || Number(price_idr) < 0) {
      return NextResponse.json({ error: 'Valid price_idr is required and must be >= 0' }, { status: 400 });
    }

    // Auto-calculate price_bidr from price_idr (1:1 conversion)
    const calculatedPriceBidr = Number(price_idr);

    const now = new Date().toISOString();

    // Always create a new license offering (multiple offerings per work are allowed)
    const { data: inserted, error: insertErr } = await supabase.from('license_offerings').insert([
      {
        id: uuidv4(),
        work_id,
        license_type,
        title,
        description: description ?? null,
        price_idr: Number(price_idr),
        price_bidr: calculatedPriceBidr,
        usage_limit: usage_limit ?? null,
        duration_days: duration_days ?? null,
        terms: terms ?? null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]).select().single();

    if (insertErr) throw insertErr;
    const data = inserted;

    // Handle royalty splits (work-level, shared across all license offerings)
    // Only set if provided and no splits exist yet for this work
    if (royalty_splits && royalty_splits.length > 0) {
      // Check if splits already exist for this work
      const { data: existingSplits } = await supabase
        .from('royalty_splits')
        .select('id')
        .eq('work_id', work_id)
        .limit(1);

      // Only insert if no splits exist yet
      if (!existingSplits || existingSplits.length === 0) {
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
    }

    return NextResponse.json({ success: true, license: data }, { status: 201 });
  } catch (err) {
    console.error('create license error', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
