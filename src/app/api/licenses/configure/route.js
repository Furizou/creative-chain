import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabase/client";

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

    const now = new Date().toISOString();

    const { data: license, error: licenseError } = await supabase
      .from("license_offerings")
      .insert([
        {
          id: uuidv4(),
          work_id,
          license_type,
          title,
          description,
          price_idr: price_idr ?? null,
          price_bidr: price_bidr ?? null,
          usage_limit: usage_limit ?? null,
          duration_days: duration_days ?? null,
          terms: terms ?? null,
          is_active: true,
          created_at: now,
          updated_at: now,
        },
      ])
      .select()
      .single();

    if (licenseError) throw licenseError;

    if (royalty_splits && royalty_splits.length > 0) {
      const splitsData = royalty_splits.map((split) => ({
        id: uuidv4(),
        work_id,
        recipient_address: split.recipient_address,
        split_percentage: split.split_percentage,
        split_contract_address: split.split_contract_address ?? null,
        created_at: now,
      }));

      const { error: splitError } = await supabase
        .from("royalty_splits")
        .insert(splitsData);

      if (splitError) throw splitError;
    }

    return NextResponse.json({ success: true, license }, { status: 201 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
