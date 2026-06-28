import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateScoreDifference } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    group: string;
  };
}

// GET /api/ranking/group/[group]
// Returns ranking for a specific group, filtered by competition
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { group } = params;
    const decodedGroup = decodeURIComponent(group);
    
    const { searchParams } = new URL(request.url);
    let comp = searchParams.get('competition');

    if (!comp) {
      const { data: configData } = await supabase
        .from('config')
        .select('value')
        .eq('key', 'active_competition')
        .maybeSingle();
      comp = configData?.value || 'WC';
    }

    // 1. Get all matches for this competition (with chunked pagination)
    let matches: any[] = [];
    let matchesFrom = 0;
    const matchesLimit = 1000;
    while (true) {
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('competition', comp)
        .order('id')
        .range(matchesFrom, matchesFrom + matchesLimit - 1);
      
      if (matchesError) throw matchesError;
      if (!matchesData || matchesData.length === 0) break;
      
      matches = matches.concat(matchesData);
      if (matchesData.length < matchesLimit) break;
      matchesFrom += matchesLimit;
    }

    const matchIds = matches ? matches.map(m => m.id) : [];
    const lastMatch = matches ? matches.find(m => m.is_last_match) : null;

    // 2. Get all users and filter by group (with chunked pagination)
    let allUsers: any[] = [];
    let usersFrom = 0;
    const usersLimit = 1000;
    while (true) {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('id')
        .range(usersFrom, usersFrom + usersLimit - 1);
      
      if (usersError) throw usersError;
      if (!usersData || usersData.length === 0) break;
      
      allUsers = allUsers.concat(usersData);
      if (usersData.length < usersLimit) break;
      usersFrom += usersLimit;
    }

    const users = (allUsers || []).filter(user => {
      if (!user.grupo) return false;
      const userGroups = user.grupo.split(',').map((g: string) => g.trim().toLowerCase());
      return userGroups.includes(decodedGroup.toLowerCase());
    });

    // 3. Get all bets for these matches and users in the group (with chunked pagination)
    let bets: any[] = [];
    const userIds = users.map(u => u.id);
    if (matchIds.length > 0 && userIds.length > 0) {
      let from = 0;
      const limit = 1000;
      while (true) {
        const { data: betsData, error: betsError } = await supabase
          .from('bets')
          .select('*')
          .in('jogo_id', matchIds)
          .in('usuario_id', userIds)
          .order('id')
          .range(from, from + limit - 1);
        
        if (betsError) throw betsError;
        if (!betsData || betsData.length === 0) break;
        
        bets = bets.concat(betsData);
        if (betsData.length < limit) break;
        from += limit;
      }
    }

    // 4. Map users and compute points and tiebreaker for this competition
    const rankingUsers = users.map(user => {
      // Filter bets for this user
      const userBets = bets.filter(b => b.usuario_id === user.id);
      const pontos_total = userBets.reduce((sum, b) => sum + (b.pontos || 0), 0);

      // Find bet for the last match of this competition
      const lastMatchBet = lastMatch ? userBets.find(b => b.jogo_id === lastMatch.id) : null;

      let diferenca_ultimo_jogo: number | null = null;
      if (
        lastMatch &&
        lastMatch.placar_casa !== null &&
        lastMatch.placar_fora !== null &&
        lastMatchBet &&
        lastMatchBet.palpite_casa !== null &&
        lastMatchBet.palpite_fora !== null
      ) {
        diferenca_ultimo_jogo = calculateScoreDifference(
          lastMatchBet.palpite_casa,
          lastMatchBet.palpite_fora,
          lastMatch.placar_casa,
          lastMatch.placar_fora
        );
      }

      return {
        id: user.id,
        nome: user.nome,
        email: user.email,
        pontos_total,
        ultimo_palpite_casa: lastMatchBet ? lastMatchBet.palpite_casa : null,
        ultimo_palpite_fora: lastMatchBet ? lastMatchBet.palpite_fora : null,
        grupo: user.grupo,
        pagou: user.pagou || false,
        is_admin: user.is_admin || false,
        diferenca_ultimo_jogo,
        posicao: 0
      };
    });

    // 5. Sort
    rankingUsers.sort((a, b) => {
      if (b.pontos_total !== a.pontos_total) {
        return b.pontos_total - a.pontos_total;
      }
      
      const aDiff = a.diferenca_ultimo_jogo !== null ? a.diferenca_ultimo_jogo : Infinity;
      const bDiff = b.diferenca_ultimo_jogo !== null ? b.diferenca_ultimo_jogo : Infinity;
      return aDiff - bDiff;
    });

    // 6. Assign position rank
    rankingUsers.forEach((user, index) => {
      user.posicao = index + 1;
    });

    return NextResponse.json({
      ranking: rankingUsers,
      total_usuarios: rankingUsers.length
    }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
