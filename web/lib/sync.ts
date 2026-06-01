import axios from 'axios';
import { supabase } from './supabase';
import { calculatePoints } from './scoring';

interface ApiMatch {
  id: number;
  utcDate: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  score: {
    fullTime: {
      home: number | null;
      away: number | null;
    }
  };
  status: string;
}

/**
 * Busca partidas da Copa do Mundo da API Football-Data.org
 */
export async function fetchMatchesFromApi(apiKey: string): Promise<ApiMatch[]> {
  // Load active competition from config (defaults to 'WC')
  const { data: configData } = await supabase
    .from('config')
    .select('value')
    .eq('key', 'active_competition')
    .maybeSingle();
  
  const compCode = configData?.value || 'WC';
  const url = `https://api.football-data.org/v4/competitions/${compCode}/matches`;
  
  try {
    const response = await axios.get(url, {
      headers: { 'X-Auth-Token': apiKey },
      timeout: 30000,
    });
    return response.data.matches || [];
  } catch (error: any) {
    console.error('Erro ao consultar API de futebol:', error.message);
    throw new Error(`Falha ao obter jogos da API: ${error.message}`);
  }
}

/**
 * Mapeia o status da API de futebol para os permitidos pelo banco de dados do Bolão
 */
export function mapStatus(apiStatus: string): 'SCHEDULED' | 'FINISHED' | 'LIVE' | 'POSTPONED' {
  switch (apiStatus) {
    case 'FINISHED':
      return 'FINISHED';
    case 'IN_PLAY':
    case 'PAUSED':
    case 'LIVE':
      return 'LIVE';
    case 'POSTPONED':
    case 'SUSPENDED':
    case 'CANCELLED':
      return 'POSTPONED';
    default:
      return 'SCHEDULED';
  }
}

/**
 * Sincroniza as partidas da API com a tabela `matches` do Supabase
 */
export async function syncMatches(apiKey: string): Promise<number> {
  const apiMatches = await fetchMatchesFromApi(apiKey);
  let updatedCount = 0;

  for (const apiMatch of apiMatches) {
    const status = mapStatus(apiMatch.status);
    const homeScore = apiMatch.score.fullTime.home;
    const awayScore = apiMatch.score.fullTime.away;

    // Verifica se jogo já existe
    const { data: existing } = await supabase
      .from('matches')
      .select('id')
      .eq('id_api', apiMatch.id)
      .maybeSingle();

    const matchData = {
      id_api: apiMatch.id,
      time_casa: apiMatch.homeTeam.name || 'A confirmar',
      time_fora: apiMatch.awayTeam.name || 'A confirmar',
      data: apiMatch.utcDate,
      placar_casa: homeScore,
      placar_fora: awayScore,
      status: status,
      updated_at: new Date().toISOString()
    };

    if (existing) {
      const { error } = await supabase
        .from('matches')
        .update(matchData)
        .eq('id', existing.id);
      
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('matches')
        .insert({
          ...matchData,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    }
    updatedCount++;
  }

  return updatedCount;
}

/**
 * Calcula os pontos de todas as apostas de jogos finalizados
 */
export async function calculateAllBets(): Promise<number> {
  const { data: finishedMatches, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'FINISHED');

  if (matchError) throw matchError;
  if (!finishedMatches) return 0;

  let calculatedCount = 0;

  for (const match of finishedMatches) {
    if (match.placar_casa === null || match.placar_fora === null) continue;

    const { data: bets, error: betError } = await supabase
      .from('bets')
      .select('*')
      .eq('jogo_id', match.id);

    if (betError) throw betError;
    if (!bets) continue;

    for (const bet of bets) {
      const points = calculatePoints(
        bet.palpite_casa,
        bet.palpite_fora,
        match.placar_casa,
        match.placar_fora
      );

      const { error: updateError } = await supabase
        .from('bets')
        .update({ pontos: points })
        .eq('id', bet.id);

      if (updateError) throw updateError;
      
      calculatedCount++;
    }
  }

  return calculatedCount;
}

/**
 * Atualiza a pontuação total acumulada de todos os usuários
 */
export async function updateUserTotals(): Promise<number> {
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id');

  if (usersError) throw usersError;
  if (!users) return 0;

  let updatedCount = 0;

  for (const user of users) {
    const { data: bets, error: betError } = await supabase
      .from('bets')
      .select('pontos')
      .eq('usuario_id', user.id);

    if (betError) throw betError;

    const totalPoints = bets ? bets.reduce((sum, bet) => sum + (bet.pontos || 0), 0) : 0;

    const { error: updateError } = await supabase
      .from('users')
      .update({ pontos_total: totalPoints })
      .eq('id', user.id);

    if (updateError) throw updateError;

    updatedCount++;
  }

  return updatedCount;
}

/**
 * Identifica e marca o último jogo da competição para critério de desempate
 */
export async function markLastMatch(): Promise<boolean> {
  // Reseta todos os jogos
  const { error: resetError } = await supabase
    .from('matches')
    .update({ is_last_match: false })
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (resetError) throw resetError;

  // Busca o jogo mais tardio (último)
  const { data: latestMatch, error: selectError } = await supabase
    .from('matches')
    .select('*')
    .order('data', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectError) throw selectError;

  if (latestMatch) {
    const { error: updateError } = await supabase
      .from('matches')
      .update({ is_last_match: true })
      .eq('id', latestMatch.id);

    if (updateError) throw updateError;
    return true;
  }

  return false;
}

/**
 * Executa o ciclo completo de sincronização e processamento do bolão
 */
export async function fullSync(apiKey: string) {
  const matchesUpdated = await syncMatches(apiKey);
  const betsCalculated = await calculateAllBets();
  const usersUpdated = await updateUserTotals();
  await markLastMatch();

  return {
    success: true,
    matches_updated: matchesUpdated,
    bets_calculated: betsCalculated,
    users_updated: usersUpdated,
    message: 'Full sync completed successfully'
  };
}
