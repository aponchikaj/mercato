/**
 * The ONLY module allowed to convert between SOL, lamports, and USD.
 * Lamports are always integers (Math.round at every boundary).
 */

export const LAMPORTS_PER_SOL = 1_000_000_000;

// demo rate
export const SOL_PRICE_USD = 150;

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

export function solToLamports(sol: number): number {
  return Math.round(sol * LAMPORTS_PER_SOL);
}

export function usdToLamports(
  usd: number,
  solPriceUsd: number = SOL_PRICE_USD,
): number {
  return Math.round((usd / solPriceUsd) * LAMPORTS_PER_SOL);
}

export function lamportsToUsd(
  lamports: number,
  solPriceUsd: number = SOL_PRICE_USD,
): number {
  return lamportsToSol(lamports) * solPriceUsd;
}
