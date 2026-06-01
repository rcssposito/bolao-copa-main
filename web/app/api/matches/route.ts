import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/matches
// Returns all matches that are SCHEDULED (available for betting)
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'SCHEDULED')
      .order('data', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
