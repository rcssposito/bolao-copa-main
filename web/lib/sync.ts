import axios from 'axios';
import { supabase } from './supabase';
import { calculatePoints } from './scoring';

interface ApiMatch {
  id: number;
  utcDate: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  score: {
    winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
    duration: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT';
    fullTime: {
      home: number | null;
      away: number | null;
    }
  };
  status: string;
  stage?: string;
}

/**
 * Busca partidas de uma competição específica da API Football-Data.org
 */
export async function fetchMatchesFromApi(apiKey: string, compCode: string): Promise<ApiMatch[]> {
  const url = `https://api.football-data.org/v4/competitions/${compCode}/matches`;
  
  try {
    const response = await axios.get(url, {
      headers: { 'X-Auth-Token': apiKey },
      timeout: 30000,
    });
    return response.data.matches || [];
  } catch (error: any) {
    console.error(`Erro ao consultar API de futebol para ${compCode}:`, error.message);
    throw new Error(`Falha ao obter jogos da API para ${compCode}: ${error.message}`);
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
  const { data: configData } = await supabase
    .from('config')
    .select('value')
    .eq('key', 'active_competition')
    .maybeSingle();
  
  const activeValue = configData?.value || 'WC';
  const compCodes = activeValue.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0);
  
  let totalUpdatedCount = 0;

  for (const compCode of compCodes) {
    try {
      const apiMatches = await fetchMatchesFromApi(apiKey, compCode);
      for (const apiMatch of apiMatches) {
        const status = mapStatus(apiMatch.status);
        const homeScore = apiMatch.score?.fullTime?.home ?? null;
        const awayScore = apiMatch.score?.fullTime?.away ?? null;

        // Verifica se jogo já existe
        const { data: existing } = await supabase
          .from('matches')
          .select('id')
          .eq('id_api', apiMatch.id)
          .maybeSingle();

        const matchData = {
          id_api: apiMatch.id,
          time_casa: apiMatch.homeTeam?.name || 'A confirmar',
          time_fora: apiMatch.awayTeam?.name || 'A confirmar',
          data: apiMatch.utcDate,
          placar_casa: homeScore,
          placar_fora: awayScore,
          status: status,
          competition: compCode,
          stage: apiMatch.stage || 'GROUP_STAGE',
          decidido_por: apiMatch.score?.duration || 'REGULAR',
          vencedor_final: apiMatch.score?.winner === 'HOME_TEAM' 
            ? 'CASA' 
            : apiMatch.score?.winner === 'AWAY_TEAM' 
              ? 'FORA' 
              : apiMatch.score?.winner === 'DRAW' 
                ? 'EMPATE' 
                : null,
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
        totalUpdatedCount++;
      }
    } catch (err: any) {
      console.error(`Erro ao sincronizar jogos para a competição ${compCode}:`, err.message);
      throw new Error(`Falha na competição ${compCode}: ${err.message}`);
    }
  }

  return totalUpdatedCount;
}

/**
 * Calcula os pontos de todas as apostas de um jogo finalizado específico
 */
export async function calculateSingleMatchBets(match: any): Promise<number> {
  if (match.placar_casa === null || match.placar_fora === null) return 0;

  const { data: bets, error: betError } = await supabase
    .from('bets')
    .select('*')
    .eq('jogo_id', match.id);

  if (betError) throw betError;
  if (!bets || bets.length === 0) return 0;

  // Executa os updates em paralelo para máxima performance
  const promises = bets.map(bet => {
    const points = calculatePoints(
      bet.palpite_casa,
      bet.palpite_fora,
      match.placar_casa,
      match.placar_fora,
      match.decidido_por,
      match.vencedor_final
    );
    return supabase
      .from('bets')
      .update({ pontos: points })
      .eq('id', bet.id);
  });

  const results = await Promise.all(promises);
  for (const res of results) {
    if (res.error) throw res.error;
  }

  return bets.length;
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

  let totalCalculated = 0;

  // Processa cada jogo finalizado em paralelo
  const matchPromises = finishedMatches.map(async (match) => {
    if (match.placar_casa === null || match.placar_fora === null) return 0;

    const { data: bets, error: betError } = await supabase
      .from('bets')
      .select('*')
      .eq('jogo_id', match.id);

    if (betError) throw betError;
    if (!bets || bets.length === 0) return 0;

    const betPromises = bets.map(bet => {
      const points = calculatePoints(
        bet.palpite_casa,
        bet.palpite_fora,
        match.placar_casa,
        match.placar_fora,
        match.decidido_por,
        match.vencedor_final
      );
      return supabase
        .from('bets')
        .update({ pontos: points })
        .eq('id', bet.id);
    });

    const results = await Promise.all(betPromises);
    for (const res of results) {
      if (res.error) throw res.error;
    }

    return bets.length;
  });

  const counts = await Promise.all(matchPromises);
  totalCalculated = counts.reduce((a, b) => a + b, 0);

  return totalCalculated;
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

  // Executa o cálculo e atualização de todos os usuários em paralelo
  const promises = users.map(async (user) => {
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
  });

  await Promise.all(promises);
  return users.length;
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
