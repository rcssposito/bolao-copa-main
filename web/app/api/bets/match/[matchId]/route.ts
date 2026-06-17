import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    matchId: string;
  };
}

// GET /api/bets/match/[matchId]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { matchId } = params;
    
    // 1. Fetch match to check kickoff time and status
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('data, status')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Partida não encontrada' }, { status: 404 });
    }

    const kickoffTime = new Date(match.data);
    const now = new Date();
    const hasStarted = kickoffTime <= now || match.status !== 'SCHEDULED';

    if (!hasStarted) {
      return NextResponse.json({ 
        error: 'As apostas só podem ser visualizadas após o início da partida.',
        hasStarted: false,
        bets: []
      }, { status: 403 });
    }

    // 2. Fetch all bets for this match along with user names and groups
    const { data, error } = await supabase
      .from('bets')
      .select(`
        id,
        usuario_id,
        jogo_id,
        palpite_casa,
        palpite_fora,
        resultado_radio,
        pontos,
        created_at,
        users!usuario_id (
          nome,
          grupo
        )
      `)
      .eq('jogo_id', matchId);

    if (error) throw error;
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
