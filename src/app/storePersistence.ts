import { createDefaultPattern, type Pattern } from "../engine/Pattern";
import { loadLibrary, saveLibrary, type PatternLibrary } from "../storage/PatternStorage";

export interface LibraryState {
  library: PatternLibrary;
  activePattern: Pattern;
  sourcePattern: Pattern;
}

export function loadLibraryState(): LibraryState {
  const library = loadLibrarySafely();
  const activePattern = selectActivePattern(library);

  return {
    library,
    activePattern,
    sourcePattern: activePattern,
  };
}

export function persistLibrary(library: PatternLibrary): void {
  if (!canUseLocalStorage()) {
    return;
  }

  saveLibrary(library);
}

function loadLibrarySafely(): PatternLibrary {
  if (!canUseLocalStorage()) {
    const activePattern = createDefaultPattern();
    return { activePatternId: activePattern.id, patterns: [activePattern] };
  }

  return loadLibrary();
}

function selectActivePattern(library: PatternLibrary): Pattern {
  return (
    library.patterns.find((pattern) => pattern.id === library.activePatternId) ??
    library.patterns[0] ??
    createDefaultPattern()
  );
}

function canUseLocalStorage(): boolean {
  return typeof localStorage !== "undefined";
}
