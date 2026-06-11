import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/admin/bets
export async function GET() {
  try {
    const { data, error } = await supabase
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
          placar_fora
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
