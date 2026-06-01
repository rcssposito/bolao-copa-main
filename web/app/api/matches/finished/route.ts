import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/matches/finished
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'FINISHED')
      .order('data', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
