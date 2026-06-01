import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateScoreDifference } from '@/lib/scoring';

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

    // 1. Get all matches for this competition
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .eq('competition', comp);

    if (matchesError) throw matchesError;

    const matchIds = matches ? matches.map(m => m.id) : [];
    const lastMatch = matches ? matches.find(m => m.is_last_match) : null;

    // 2. Get all users and filter by group (split by comma for multi-group support)
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) throw usersError;

    const users = (allUsers || []).filter(user => {
      if (!user.grupo) return false;
      const userGroups = user.grupo.split(',').map((g: string) => g.trim().toLowerCase());
      return userGroups.includes(decodedGroup.toLowerCase());
    });

    // 3. Get all bets for these matches
    let bets: any[] = [];
    if (matchIds.length > 0) {
      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .in('jogo_id', matchIds);
      if (betsError) throw betsError;
      bets = betsData || [];
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
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
