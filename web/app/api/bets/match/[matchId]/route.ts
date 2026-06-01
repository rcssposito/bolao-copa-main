import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface RouteParams {
  params: {
    matchId: string;
  };
}

// GET /api/bets/match/[matchId]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { matchId } = params;
    
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .eq('jogo_id', matchId);

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
