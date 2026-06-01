import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/matches/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    const { placar_casa, placar_fora, status, is_last_match } = body;

    const updateData: any = {};
    if (placar_casa !== undefined) updateData.placar_casa = placar_casa;
    if (placar_fora !== undefined) updateData.placar_fora = placar_fora;
    if (status !== undefined) updateData.status = status;
    if (is_last_match !== undefined) updateData.is_last_match = is_last_match;

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
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
