import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/bets
// Create or update a bet (upsert)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { usuario_id, jogo_id, palpite_casa, palpite_fora, resultado_radio } = body;

    if (!usuario_id || !jogo_id || palpite_casa === undefined || palpite_fora === undefined || !resultado_radio) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    // Business Rule Validation: Verify if match has already started
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('data, status')
      .eq('id', jogo_id)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Partida não encontrada' }, { status: 404 });
    }

    // Check match start time
    const kickoffTime = new Date(match.data);
    const now = new Date();
    
    if (kickoffTime <= now || match.status !== 'SCHEDULED') {
      return NextResponse.json({ 
        error: 'Aposta bloqueada: Esta partida já começou ou foi finalizada.' 
      }, { status: 400 });
    }

    // Check if user is the last match predictor (for tiebreaker)
    // If this is the last match, store the prediction in users table too
    const { data: fullMatch } = await supabase
      .from('matches')
      .select('is_last_match')
      .eq('id', jogo_id)
      .single();

    if (fullMatch?.is_last_match) {
      await supabase
        .from('users')
        .update({
          ultimo_palpite_casa: parseInt(palpite_casa, 10),
          ultimo_palpite_fora: parseInt(palpite_fora, 10)
        })
        .eq('id', usuario_id);
    }

    // Upsert bet
    // Unique constraint on (usuario_id, jogo_id) triggers update on conflict
    const { data, error } = await supabase
      .from('bets')
      .upsert({
        usuario_id,
        jogo_id,
        palpite_casa: parseInt(palpite_casa, 10),
        palpite_fora: parseInt(palpite_fora, 10),
        resultado_radio,
        pontos: 0, // Reset points to 0 since match hasn't finished yet
        created_at: new Date().toISOString()
      }, {
        onConflict: 'usuario_id,jogo_id'
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
