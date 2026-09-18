import { createDefaultPattern, validatePattern, type Pattern } from "../engine/Pattern";

const STORAGE_KEY = "ghost.patterns.v1";

export interface PatternLibrary {
  activePatternId: string;
  patterns: Pattern[];
}

export function loadLibrary(): PatternLibrary {
  const fallback = createFallbackLibrary();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as PatternLibrary;
    const patterns = parsed.patterns.filter(validatePattern);
    if (!patterns.length) {
      return fallback;
    }

    return {
      activePatternId: parsed.activePatternId ?? patterns[0].id,
      patterns,
    };
  } catch {
    return fallback;
  }
}

export function saveLibrary(library: PatternLibrary): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
}

export function exportPatternJson(pattern: Pattern): string {
  return JSON.stringify(pattern, null, 2);
}

export function importPatternJson(json: string): Pattern {
  const parsed = JSON.parse(json) as Pattern;
  if (!validatePattern(parsed)) {
    throw new Error("Invalid GHOST pattern JSON.");
  }
  return parsed;
}

function createFallbackLibrary(): PatternLibrary {
  const pattern = createDefaultPattern();
  return {
    activePatternId: pattern.id,
    patterns: [pattern],
  };
}
