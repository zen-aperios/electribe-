import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultPattern } from "../engine/Pattern";
import { loadLibraryState, persistLibrary } from "../app/storePersistence";
import type { PatternLibrary } from "../storage/PatternStorage";

beforeEach(() => {
  vi.stubGlobal("localStorage", createMemoryStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("store persistence helpers", () => {
  it("loads a fallback library without browser storage", () => {
    vi.stubGlobal("localStorage", undefined);

    const state = loadLibraryState();

    expect(state.library.patterns).toHaveLength(1);
    expect(state.activePattern.id).toBe(state.library.activePatternId);
    expect(state.sourcePattern).toBe(state.activePattern);
  });

  it("loads the saved active pattern from browser storage", () => {
    const inactivePattern = createDefaultPattern("Inactive");
    const activePattern = createDefaultPattern("Active");
    const library: PatternLibrary = {
      activePatternId: activePattern.id,
      patterns: [inactivePattern, activePattern],
    };

    persistLibrary(library);

    expect(loadLibraryState().activePattern.name).toBe("Active");
  });

  it("skips saving when browser storage is unavailable", () => {
    const pattern = createDefaultPattern();

    vi.stubGlobal("localStorage", undefined);

    expect(() =>
      persistLibrary({ activePatternId: pattern.id, patterns: [pattern] }),
    ).not.toThrow();
  });
});

function createMemoryStorage(): Storage {
  const items = new Map<string, string>();

  return {
    get length() {
      return items.size;
    },
    clear() {
      items.clear();
    },
    getItem(key) {
      return items.get(key) ?? null;
    },
    key(index) {
      return Array.from(items.keys())[index] ?? null;
    },
    removeItem(key) {
      items.delete(key);
    },
    setItem(key, value) {
      items.set(key, value);
    },
  };
}
