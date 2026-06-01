import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/matches/upcoming
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .in('status', ['SCHEDULED', 'LIVE', 'POSTPONED'])
      .order('data', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
