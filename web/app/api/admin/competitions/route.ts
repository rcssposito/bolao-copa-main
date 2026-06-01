import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fullSync } from '@/lib/sync';
import axios from 'axios';

// GET /api/admin/competitions
// Returns available competitions from football API and the currently active one
export async function GET() {
  try {
    const apiKey = process.env.FOOTBALL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chave da API de futebol (FOOTBALL_API_KEY) não configurada.' }, { status: 500 });
    }

    // 1. Get current active competition from database config
    const { data: configData, error: configError } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'active_competition')
      .maybeSingle();

    if (configError) throw configError;
    const activeCode = configData?.value || 'WC';

    // 2. Fetch available competitions from football-data.org API
    const response = await axios.get('https://api.football-data.org/v4/competitions', {
      headers: { 'X-Auth-Token': apiKey },
      timeout: 15000,
    });

    const apiCompetitions = response.data.competitions || [];
    
    // Map list to return clean names and codes
    const competitions = apiCompetitions.map((c: any) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      emblem: c.emblem
    }));

    return NextResponse.json({
      active: activeCode,
      competitions
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/competitions
// Sets the active competition, clears the old matches, and triggers a full sync for the new one
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.FOOTBALL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chave da API de futebol (FOOTBALL_API_KEY) não configurada.' }, { status: 500 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Código da competição é obrigatório.' }, { status: 400 });
    }

    // 1. Save new active competition to config table
    const { error: configError } = await supabase
      .from('config')
      .upsert({
        key: 'active_competition',
        value: code,
        updated_at: new Date().toISOString()
      });

    if (configError) throw configError;

    // 2. Do not clear matches table so that we preserve matches and bets for all competitions.
    // The sync will simply insert/update matches of the new competition.

    // 3. Trigger full sync for the new competition matches
    const syncResult = await fullSync(apiKey);

    return NextResponse.json({
      success: true,
      message: `Competição ativa alterada para ${code}. Partidas limpas e sincronizadas com sucesso.`,
      syncResult
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
