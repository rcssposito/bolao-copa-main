/**
 * Calcula os pontos obtidos com base nas regras do bolão:
 * - Vitória com placar exato: 7 pontos
 * - Vitória sem placar exato: 5 pontos
 * - Empate com placar exato: 7 pontos
 * - Empate sem placar exato: 5 pontos
 * - Quando houver prorrogação ou pênaltis, identificar o vencedor mas manter os 5 pontos.
 */
export function calculatePoints(
  betHome: number,
  betAway: number,
  actualHome: number,
  actualAway: number,
  decididoPor?: string | null,
  vencedorFinal?: string | null
): number {
  // 1. Quando houver prorrogação ou pênaltis
  if (decididoPor === 'EXTRA_TIME' || decididoPor === 'PENALTY_SHOOTOUT') {
    let betResult: 'CASA' | 'EMPATE' | 'FORA';
    if (betHome > betAway) {
      betResult = 'CASA';
    } else if (betHome < betAway) {
      betResult = 'FORA';
    } else {
      betResult = 'EMPATE';
    }

    // Se o usuário identificou o vencedor final da disputa (CASA ou FORA), ganha 5 pontos
    if (vencedorFinal && (vencedorFinal === 'CASA' || vencedorFinal === 'FORA') && betResult === vencedorFinal) {
      return 5;
    }
    return 0;
  }

  // 2. Tempo regulamentar (REGULAR ou indeterminado)
  // Placar exato
  if (betHome === actualHome && betAway === actualAway) {
    return 7;
  }

  // Determinar resultado real
  let actualResult: 'CASA' | 'EMPATE' | 'FORA';
  if (actualHome > actualAway) {
    actualResult = 'CASA';
  } else if (actualHome < actualAway) {
    actualResult = 'FORA';
  } else {
    actualResult = 'EMPATE';
  }

  // Determinar resultado do palpite
  let betResult: 'CASA' | 'EMPATE' | 'FORA';
  if (betHome > betAway) {
    betResult = 'CASA';
  } else if (betHome < betAway) {
    betResult = 'FORA';
  } else {
    betResult = 'EMPATE';
  }

  // Acertou o vencedor ou o empate
  if (betResult === actualResult) {
    return 5;
  }

  return 0;
}

/**
 * Calcula a diferença absoluta entre o palpite e o placar real.
 * Utilizado como primeiro critério de desempate (menor diferença vence).
 */
export function calculateScoreDifference(
  betHome: number,
  betAway: number,
  actualHome: number,
  actualAway: number
): number {
  return Math.abs(betHome - actualHome) + Math.abs(betAway - actualAway);
}
