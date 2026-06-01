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
