import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fullSync } from '@/lib/sync';
import axios from 'axios';

export const dynamic = 'force-dynamic';

const STATIC_COMPETITIONS = [
  { id: 2000, name: 'FIFA World Cup', code: 'WC', emblem: '' },
  { id: 2001, name: 'UEFA Champions League', code: 'CL', emblem: '' },
  { id: 2013, name: 'Campeonato Brasileiro Série A', code: 'BSA', emblem: '' },
  { id: 2152, name: 'Copa Libertadores', code: 'CLI', emblem: '' },
  { id: 2021, name: 'Premier League', code: 'PL', emblem: '' },
  { id: 2014, name: 'Primera Division (La Liga)', code: 'PD', emblem: '' },
  { id: 2002, name: 'Bundesliga', code: 'BL1', emblem: '' },
  { id: 2019, name: 'Serie A (Itália)', code: 'SA', emblem: '' },
  { id: 2015, name: 'Ligue 1', code: 'FL1', emblem: '' },
  { id: 2003, name: 'Eredivisie', code: 'DED', emblem: '' },
  { id: 2017, name: 'Primeira Liga (Portugal)', code: 'PPL', emblem: '' },
  { id: 2016, name: 'Championship', code: 'ELC', emblem: '' },
  { id: 2018, name: 'European Championship (Euro)', code: 'EC', emblem: '' }
];

// GET /api/admin/competitions
// Returns available competitions from football API and the currently active one
export async function GET() {
  try {
    const apiKey = process.env.FOOTBALL_API_KEY;

    // 1. Get current active competition from database config
    const { data: configData, error: configError } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'active_competition')
      .maybeSingle();

    if (configError) throw configError;
    const activeCode = configData?.value || 'WC';

    // 2. Fetch available competitions from football-data.org API
    let competitions = [];
    if (apiKey) {
      try {
        const response = await axios.get('https://api.football-data.org/v4/competitions', {
          headers: { 'X-Auth-Token': apiKey },
          timeout: 10000,
        });

        const apiCompetitions = response.data.competitions || [];
        competitions = apiCompetitions.map((c: any) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          emblem: c.emblem
        }));
      } catch (apiError: any) {
        console.warn('Falha ao consultar API de futebol (usando fallback estático):', apiError.message);
        competitions = STATIC_COMPETITIONS;
      }
    } else {
      console.warn('Chave da API de futebol não configurada (usando fallback estático).');
      competitions = STATIC_COMPETITIONS;
    }

    return NextResponse.json({
      active: activeCode,
      competitions
    }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/competitions
// Sets the active competitions list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Código da competição é obrigatório.' }, { status: 400 });
    }

    const value = Array.isArray(code) ? code.join(',') : code.toString();

    // 1. Save new active competition list to config table
    const { error: configError } = await supabase
      .from('config')
      .upsert({
        key: 'active_competition',
        value: value,
        updated_at: new Date().toISOString()
      });

    if (configError) throw configError;

    return NextResponse.json({
      success: true,
      message: `Competições ativas alteradas para ${value} com sucesso. Por favor, clique em 'Sincronizar' para trazer os novos jogos.`
    }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
