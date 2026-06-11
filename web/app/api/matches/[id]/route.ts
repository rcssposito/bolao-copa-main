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

import { calculateAllBets, updateUserTotals, markLastMatch } from '@/lib/sync';

// PUT /api/matches/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    const { placar_casa, placar_fora, status, is_last_match, decidido_por, vencedor_final, stage } = body;

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

    // Trigger point recalculation dynamically if match status is set to FINISHED
    if (data.status === 'FINISHED' && data.placar_casa !== null && data.placar_fora !== null) {
      try {
        await calculateAllBets();
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
