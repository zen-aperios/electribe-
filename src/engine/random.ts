export interface RandomSource {
  next(): number;
  integer(min: number, max: number): number;
  chance(probability: number): boolean;
  pick<T>(items: T[]): T;
}

export function createSeededRandom(seed: string | number): RandomSource {
  let state = hashSeed(String(seed));

  const next = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    integer(min, max) {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    chance(probability) {
      return next() < probability;
    },
    pick(items) {
      return items[Math.floor(next() * items.length)];
    },
  };
}

function hashSeed(seed: string): number {
  let hash = 1779033703 ^ seed.length;
  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return hash >>> 0;
}
