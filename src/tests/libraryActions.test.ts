import { describe, expect, it } from "vitest";
import { createDefaultPattern } from "../engine/Pattern";
import {
  createLibraryPattern,
  deleteLibraryPattern,
  duplicateLibraryPattern,
  importPatternToLibrary,
  isPatternDirty,
  renameLibraryPattern,
  savePatternToLibrary,
  setActiveLibraryPattern,
} from "../app/libraryActions";
import type { PatternLibrary } from "../storage/PatternStorage";

function makeLibrary(): PatternLibrary {
  const pattern = createDefaultPattern("Base");
  return {
    activePatternId: pattern.id,
    patterns: [pattern],
  };
}

describe("library action helpers", () => {
  it("detects dirty patterns ignoring timestamps", () => {
    const library = makeLibrary();
    const saved = library.patterns[0];

    expect(isPatternDirty(library, { ...saved, updatedAt: "later" })).toBe(false);
    expect(isPatternDirty(library, { ...saved, bpm: saved.bpm + 1 })).toBe(true);
  });

  it("saves active patterns into the library", () => {
    const library = makeLibrary();
    const activePattern = { ...library.patterns[0], bpm: 133 };
    const saved = savePatternToLibrary(library, activePattern);

    expect(saved.activePatternId).toBe(activePattern.id);
    expect(saved.patterns[0].bpm).toBe(133);
  });

  it("sets an active library pattern by id", () => {
    const library = createLibraryPattern(makeLibrary()).library;
    const target = library.patterns[1];
    const result = setActiveLibraryPattern(library, target.id);

    expect(result?.activePattern.id).toBe(target.id);
    expect(result?.library.activePatternId).toBe(target.id);
  });

  it("creates, duplicates, renames, imports, and deletes patterns", () => {
    const base = makeLibrary();
    const created = createLibraryPattern(base);
    expect(created.library.patterns).toHaveLength(2);

    const duplicated = duplicateLibraryPattern(created.library, created.activePattern);
    expect(duplicated.activePattern.name).toContain("Copy");

    const renamed = renameLibraryPattern(
      duplicated.library,
      duplicated.activePattern,
      "Renamed",
    );
    expect(renamed?.activePattern.name).toBe("Renamed");

    const importedPattern = createDefaultPattern("Imported");
    const imported = importPatternToLibrary(renamed!.library, importedPattern);
    expect(imported.library.patterns[0].name).toBe("Imported");

    const deleted = deleteLibraryPattern(imported.library, imported.activePattern);
    expect(deleted.activePattern.id).not.toBe(imported.activePattern.id);
  });
});
