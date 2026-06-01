import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateScoreDifference } from '@/lib/scoring';

// GET /api/ranking
export async function GET() {
  try {
    // 1. Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) throw usersError;

    // 2. Get last match (used for tiebreaker)
    const { data: lastMatchData } = await supabase
      .from('matches')
      .select('*')
      .eq('is_last_match', true)
      .maybeSingle();

    const lastMatch = lastMatchData || null;

    // 3. Map users and compute tiebreaker value
    const rankingUsers = users.map(user => {
      let diferenca_ultimo_jogo: number | null = null;

      if (
        lastMatch &&
        lastMatch.placar_casa !== null &&
        lastMatch.placar_fora !== null &&
        user.ultimo_palpite_casa !== null &&
        user.ultimo_palpite_fora !== null
      ) {
        diferenca_ultimo_jogo = calculateScoreDifference(
          user.ultimo_palpite_casa,
          user.ultimo_palpite_fora,
          lastMatch.placar_casa,
          lastMatch.placar_fora
        );
      }

      return {
        id: user.id,
        nome: user.nome,
        email: user.email,
        pontos_total: user.pontos_total || 0,
        ultimo_palpite_casa: user.ultimo_palpite_casa,
        ultimo_palpite_fora: user.ultimo_palpite_fora,
        grupo: user.grupo,
        pagou: user.pagou || false,
        is_admin: user.is_admin || false,
        diferenca_ultimo_jogo,
        posicao: 0 // Will be set below
      };
    });

    // 4. Sort:
    // a. More points first (descending)
    // b. Lower difference first (ascending)
    // c. Users without a difference (null) go to the end
    rankingUsers.sort((a, b) => {
      if (b.pontos_total !== a.pontos_total) {
        return b.pontos_total - a.pontos_total;
      }
      
      const aDiff = a.diferenca_ultimo_jogo !== null ? a.diferenca_ultimo_jogo : Infinity;
      const bDiff = b.diferenca_ultimo_jogo !== null ? b.diferenca_ultimo_jogo : Infinity;
      return aDiff - bDiff;
    });

    // 5. Assign position rank
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
