import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/admin/bets
export async function GET() {
  try {
    let allBets: any[] = [];
    let from = 0;
    const limit = 1000;
    while (true) {
      const { data: chunk, error } = await supabase
        .from('bets')
        .select(`
          id,
          palpite_casa,
          palpite_fora,
          resultado_radio,
          pontos,
          created_at,
          users!usuario_id (
            id,
            nome,
            email,
            grupo
          ),
          matches!jogo_id (
            id,
            time_casa,
            time_fora,
            data,
            status,
            placar_casa,
            placar_fora,
            stage,
            competition
          )
        `)
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1);

      if (error) throw error;
      if (!chunk || chunk.length === 0) break;

      allBets = allBets.concat(chunk);
      if (chunk.length < limit) break;
      from += limit;
    }

    return NextResponse.json(allBets, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
