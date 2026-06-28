import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/matches/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Partida não encontrada' }, { status: 404 });
      }
      throw error;
    }
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { calculateSingleMatchBets, updateUserTotals, markLastMatch } from '@/lib/sync';

const KNOCKOUT_PROGRESSION: Record<string, string> = {
  'LAST_32': 'LAST_16',
  'LAST_16': 'QUARTER_FINALS',
  'QUARTER_FINALS': 'SEMI_FINALS',
  'SEMI_FINALS': 'FINAL'
};

async function propagateMatchWinner(match: any) {
  const currentStage = match.stage;
  const nextStage = KNOCKOUT_PROGRESSION[currentStage];
  if (!nextStage) return;

  // 1. Determine if we are advancing or rolling back
  const isFinished = match.status === 'FINISHED';
  let winnerName = 'A confirmar';
  let loserName = 'A confirmar';

  if (isFinished && match.placar_casa !== null && match.placar_fora !== null) {
    const placarCasa = match.placar_casa;
    const placarFora = match.placar_fora;
    const decididoPor = match.decidido_por || 'REGULAR';
    const vencedorFinal = match.vencedor_final;

    if (decididoPor === 'REGULAR') {
      if (placarCasa > placarFora) {
        winnerName = match.time_casa;
        loserName = match.time_fora;
      } else if (placarCasa < placarFora) {
        winnerName = match.time_fora;
        loserName = match.time_casa;
      } else {
        if (vencedorFinal === 'CASA') {
          winnerName = match.time_casa;
          loserName = match.time_fora;
        } else if (vencedorFinal === 'FORA') {
          winnerName = match.time_fora;
          loserName = match.time_casa;
        }
      }
    } else {
      if (vencedorFinal === 'CASA') {
        winnerName = match.time_casa;
        loserName = match.time_fora;
      } else if (vencedorFinal === 'FORA') {
        winnerName = match.time_fora;
        loserName = match.time_casa;
      }
    }
  }

  // 2. Fetch all matches of the current stage sorted by date
  const { data: currentStageMatches, error: err1 } = await supabase
    .from('matches')
    .select('*')
    .eq('competition', match.competition)
    .eq('stage', currentStage)
    .order('data', { ascending: true });

  if (err1 || !currentStageMatches) {
    console.error('Error fetching current stage matches for propagation:', err1);
    return;
  }

  const matchIndex = currentStageMatches.findIndex((m: any) => m.id === match.id);
  if (matchIndex === -1) return;

  const nextMatchIndex = Math.floor(matchIndex / 2);
  const isHomeSlot = matchIndex % 2 === 0;

  // 3. Fetch all matches of the next stage sorted by date
  const { data: nextStageMatches, error: err2 } = await supabase
    .from('matches')
    .select('*')
    .eq('competition', match.competition)
    .eq('stage', nextStage)
    .order('data', { ascending: true });

  if (err2 || !nextStageMatches || nextStageMatches.length === 0) {
    console.error('Error fetching next stage matches for propagation:', err2);
    return;
  }

  const nextMatch = nextStageMatches[nextMatchIndex];
  if (nextMatch) {
    const updatePayload: any = isHomeSlot 
      ? { time_casa: winnerName } 
      : { time_fora: winnerName };

    const { error: updateErr } = await supabase
      .from('matches')
      .update(updatePayload)
      .eq('id', nextMatch.id);

    if (updateErr) {
      console.error('Error updating next stage match:', updateErr);
    }
  }

  // 4. Handle SEMI_FINALS loser propagation to THIRD_PLACE
  if (currentStage === 'SEMI_FINALS') {
    const { data: thirdPlaceMatches, error: err3 } = await supabase
      .from('matches')
      .select('*')
      .eq('competition', match.competition)
      .eq('stage', 'THIRD_PLACE')
      .order('data', { ascending: true });

    if (err3 || !thirdPlaceMatches || thirdPlaceMatches.length === 0) {
      console.error('Error fetching third place matches for propagation:', err3);
      return;
    }

    const thirdPlaceMatch = thirdPlaceMatches[0];
    if (thirdPlaceMatch) {
      const updatePayload: any = isHomeSlot
        ? { time_casa: loserName }
        : { time_fora: loserName };

      const { error: updateErr3 } = await supabase
        .from('matches')
        .update(updatePayload)
        .eq('id', thirdPlaceMatch.id);

      if (updateErr3) {
        console.error('Error updating third place match:', updateErr3);
      }
    }
  }
}

// PUT /api/matches/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    const { placar_casa, placar_fora, status, is_last_match, decidido_por, vencedor_final, stage, time_casa, time_fora, data: matchDate } = body;

    const updateData: any = {};
    
    // Parse scores (integer or null)
    if (placar_casa !== undefined) {
      updateData.placar_casa = (placar_casa === null || placar_casa === '') ? null : parseInt(placar_casa.toString(), 10);
    }
    if (placar_fora !== undefined) {
      updateData.placar_fora = (placar_fora === null || placar_fora === '') ? null : parseInt(placar_fora.toString(), 10);
    }
    
    if (status !== undefined) updateData.status = status;
    if (is_last_match !== undefined) updateData.is_last_match = is_last_match;
    if (decidido_por !== undefined) updateData.decidido_por = decidido_por;
    if (vencedor_final !== undefined) updateData.vencedor_final = vencedor_final;
    if (stage !== undefined) updateData.stage = stage;
    if (time_casa !== undefined) updateData.time_casa = time_casa;
    if (time_fora !== undefined) updateData.time_fora = time_fora;
    if (matchDate !== undefined) updateData.data = matchDate;

    // Auto-calculate winner for regular time decisions
    const decPor = decidido_por || 'REGULAR';
    if (status === 'FINISHED' && decPor === 'REGULAR' && vencedor_final === undefined && updateData.placar_casa !== null && updateData.placar_fora !== null) {
      const home = updateData.placar_casa;
      const away = updateData.placar_fora;
      updateData.vencedor_final = home > away ? 'CASA' : home < away ? 'FORA' : 'EMPATE';
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('matches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Partida não encontrada' }, { status: 404 });
      }
      throw error;
    }

    // Propagate winner to next stage in knockout brackets
    try {
      await propagateMatchWinner(data);
    } catch (progError: any) {
      console.error('Erro ao propagar vencedor da partida:', progError.message);
    }

    // Trigger point recalculation dynamically if match status is set to FINISHED
    if (data.status === 'FINISHED' && data.placar_casa !== null && data.placar_fora !== null) {
      try {
        await calculateSingleMatchBets(data);
        await updateUserTotals();
        await markLastMatch();
      } catch (calcError: any) {
        console.error('Erro ao processar recálculo de pontos após atualização manual:', calcError.message);
      }
    }

    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
