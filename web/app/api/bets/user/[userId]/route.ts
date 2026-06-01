import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    userId: string;
  };
}

// GET /api/bets/user/[userId]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = params;
    
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .eq('usuario_id', userId);

    if (error) throw error;
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
