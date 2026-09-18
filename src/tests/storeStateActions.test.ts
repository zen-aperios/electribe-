import { describe, expect, it } from "vitest";
import { createDefaultPattern } from "../engine/Pattern";
import {
  activateLibraryPatternState,
  refreshActiveLibraryPatternState,
} from "../app/storeStateActions";
import type { PatternLibrary } from "../storage/PatternStorage";

describe("store state helpers", () => {
  it("activates a library pattern and resets workflow state", () => {
    const pattern = createDefaultPattern("Active");
    const library: PatternLibrary = {
      activePatternId: pattern.id,
      patterns: [pattern],
    };

    expect(activateLibraryPatternState(library, pattern)).toEqual({
      library,
      activePattern: pattern,
      sourcePattern: pattern,
      variations: [],
      selectedVariationId: null,
      selectedNote: null,
      compareMode: "A",
    });
  });

  it("refreshes the active library pattern without workflow reset fields", () => {
    const pattern = createDefaultPattern("Renamed");
    const library: PatternLibrary = {
      activePatternId: pattern.id,
      patterns: [pattern],
    };

    expect(refreshActiveLibraryPatternState(library, pattern)).toEqual({
      library,
      activePattern: pattern,
      sourcePattern: pattern,
      selectedNote: null,
    });
  });
});
