import { clonePattern, createDefaultPattern, type Pattern } from "../engine/Pattern";
import type { PatternLibrary } from "../storage/PatternStorage";

export function isPatternDirty(library: PatternLibrary, activePattern: Pattern): boolean {
  const saved = library.patterns.find((pattern) => pattern.id === activePattern.id);
  return !saved || stablePatternString(saved) !== stablePatternString(activePattern);
}

export function savePatternToLibrary(
  library: PatternLibrary,
  activePattern: Pattern,
): PatternLibrary {
  return {
    activePatternId: activePattern.id,
    patterns: [
      activePattern,
      ...library.patterns.filter((pattern) => pattern.id !== activePattern.id),
    ],
  };
}

export function setActiveLibraryPattern(
  library: PatternLibrary,
  id: string,
): { library: PatternLibrary; activePattern: Pattern } | null {
  const activePattern = library.patterns.find((pattern) => pattern.id === id);
  if (!activePattern) {
    return null;
  }

  return {
    library: { ...library, activePatternId: activePattern.id },
    activePattern,
  };
}

export function createLibraryPattern(library: PatternLibrary): {
  library: PatternLibrary;
  activePattern: Pattern;
} {
  const activePattern = createDefaultPattern(
    `Ghost Pattern ${String(library.patterns.length + 1).padStart(2, "0")}`,
  );
  return {
    library: {
      activePatternId: activePattern.id,
      patterns: [activePattern, ...library.patterns],
    },
    activePattern,
  };
}

export function duplicateLibraryPattern(
  library: PatternLibrary,
  activePattern: Pattern,
): { library: PatternLibrary; activePattern: Pattern } {
  const duplicate = clonePattern(activePattern, `${activePattern.name} Copy`);
  return {
    library: {
      activePatternId: duplicate.id,
      patterns: [duplicate, ...library.patterns],
    },
    activePattern: duplicate,
  };
}

export function renameLibraryPattern(
  library: PatternLibrary,
  activePattern: Pattern,
  name: string,
): { library: PatternLibrary; activePattern: Pattern } | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return null;
  }

  const renamed = {
    ...activePattern,
    name: trimmed,
    updatedAt: new Date().toISOString(),
  };

  return {
    library: savePatternToLibrary(library, renamed),
    activePattern: renamed,
  };
}

export function deleteLibraryPattern(
  library: PatternLibrary,
  activePattern: Pattern,
): { library: PatternLibrary; activePattern: Pattern } {
  const remaining = library.patterns.filter((pattern) => pattern.id !== activePattern.id);
  const nextActivePattern = remaining[0] ?? createDefaultPattern("Ghost Pattern 01");
  return {
    library: {
      activePatternId: nextActivePattern.id,
      patterns: remaining.length ? remaining : [nextActivePattern],
    },
    activePattern: nextActivePattern,
  };
}

export function importPatternToLibrary(
  library: PatternLibrary,
  pattern: Pattern,
): { library: PatternLibrary; activePattern: Pattern } {
  return {
    library: {
      activePatternId: pattern.id,
      patterns: [
        pattern,
        ...library.patterns.filter((candidate) => candidate.id !== pattern.id),
      ],
    },
    activePattern: pattern,
  };
}

function stablePatternString(pattern: Pattern): string {
  return JSON.stringify({
    ...pattern,
    updatedAt: undefined,
    createdAt: undefined,
  });
}
