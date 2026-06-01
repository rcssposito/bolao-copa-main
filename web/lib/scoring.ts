/**
 * Calcula os pontos obtidos com base nas regras do bolão:
 * - Placar exato: 7 pontos
 * - Vencedor correto (com placar diferente): 5 pontos
 * - Empate correto (com placar diferente): 3 pontos
 * - Erro (vencedor/empate incorreto): 0 pontos
 */
export function calculatePoints(
  betHome: number,
  betAway: number,
  actualHome: number,
  actualAway: number
): number {
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
    return actualResult === 'EMPATE' ? 3 : 5;
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
