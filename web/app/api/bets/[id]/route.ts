import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/bets/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Aposta não encontrada' }, { status: 404 });
      }
      throw error;
    }
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/bets/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Check if match started before deleting
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .select('jogo_id')
      .eq('id', id)
      .single();

    if (betError || !bet) {
      return NextResponse.json({ error: 'Aposta não encontrada' }, { status: 404 });
    }

    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('data')
      .eq('id', bet.jogo_id)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Partida correspondente não encontrada' }, { status: 404 });
    }

    if (new Date(match.data) <= new Date()) {
      return NextResponse.json({ error: 'Aposta bloqueada: O jogo correspondente já começou.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('bets')
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;
    
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Aposta não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Aposta deletada com sucesso' }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { calculatePoints } from '@/lib/scoring';

// PUT /api/bets/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    const { palpite_casa, palpite_fora } = body;

    if (palpite_casa === undefined || palpite_fora === undefined) {
      return NextResponse.json({ error: 'Campos palpite_casa e palpite_fora são obrigatórios' }, { status: 400 });
    }

    const valCasa = parseInt(palpite_casa.toString(), 10);
    const valFora = parseInt(palpite_fora.toString(), 10);

    // 1. Fetch the existing bet and its match status
    const { data: existingBet, error: betError } = await supabase
      .from('bets')
      .select('*, matches!jogo_id(*)')
      .eq('id', id)
      .single();

    if (betError || !existingBet) {
      return NextResponse.json({ error: 'Aposta não encontrada' }, { status: 404 });
    }

    // 2. Calculate points if the match is finished
    let pontos = 0;
    const match = (existingBet as any).matches;
    if (match && match.status === 'FINISHED' && match.placar_casa !== null && match.placar_fora !== null) {
      pontos = calculatePoints(
        valCasa,
        valFora,
        match.placar_casa,
        match.placar_fora,
        match.decidido_por,
        match.vencedor_final
      );
    }

    // 3. Update the bet
    const { data: updatedBet, error: updateError } = await supabase
      .from('bets')
      .update({
        palpite_casa: valCasa,
        palpite_fora: valFora,
        pontos: pontos
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 4. Update the user total points
    const { data: userBets, error: userBetsError } = await supabase
      .from('bets')
      .select('pontos')
      .eq('usuario_id', existingBet.usuario_id);

    if (!userBetsError && userBets) {
      const totalPoints = userBets.reduce((sum, b) => sum + (b.pontos || 0), 0);
      await supabase
        .from('users')
        .update({ pontos_total: totalPoints })
        .eq('id', existingBet.usuario_id);
    }

    return NextResponse.json(updatedBet, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
