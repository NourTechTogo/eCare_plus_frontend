/** Générateur pseudo-aléatoire déterministe : le jeu de données est identique à chaque création. */
export function createRandom(seed: number) {
  let state = seed
  const next = () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    /** Valeur autour de `center`, à plus ou moins `spread`. */
    around: (center: number, spread: number) => center + (next() * 2 - 1) * spread,
    chance: (probability: number) => next() < probability,
  }
}

export const round = (value: number, digits = 0) => {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
