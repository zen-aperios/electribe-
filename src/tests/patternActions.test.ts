import { describe, expect, it } from "vitest";
import { createDefaultPattern, validatePattern } from "../engine/Pattern";
import {
  deletePatternNote,
  reorderPatternTracks,
  togglePatternNote,
  updatePatternMetadata,
  updatePatternNote,
  updateTrackElectribeParameter,
  updateTrackMapping,
  updateTrackPerformance,
} from "../app/patternActions";

describe("pattern action helpers", () => {
  it("resizes pattern metadata and clears selected notes", () => {
    const pattern = createDefaultPattern();
    const selectedNote = { trackId: pattern.tracks[0].id, noteId: pattern.tracks[0].notes[0].id };
    const result = updatePatternMetadata(pattern, { length: 8 }, selectedNote);

    expect(result.pattern.length).toBe(8);
    expect(result.selectedNote).toBeNull();
    expect(validatePattern(result.pattern)).toBe(true);
  });

  it("updates track mapping with channel clamping", () => {
    const pattern = createDefaultPattern();
    const updated = updateTrackMapping(pattern, pattern.tracks[0].id, {
      name: "Drum One",
      instrumentName: "Electribe Kick Layer",
      midiChannel: 99,
    });

    expect(updated.tracks[0].name).toBe("Drum One");
    expect(updated.tracks[0].instrumentName).toBe("Electribe Kick Layer");
    expect(updated.tracks[0].midiChannel).toBe(16);
  });

  it("updates track performance with volume clamping", () => {
    const pattern = createDefaultPattern();
    const updated = updateTrackPerformance(pattern, pattern.tracks[0].id, {
      muted: true,
      volume: -1,
    });

    expect(updated.tracks[0].muted).toBe(true);
    expect(updated.tracks[0].volume).toBe(0);
  });

  it("reorders tracks and remaps channels to part slots", () => {
    const pattern = createDefaultPattern();
    const updated = reorderPatternTracks(pattern, 4, 1);

    expect(updated.tracks[1].instrumentType).toBe("bass");
    expect(updated.tracks.map((track) => track.midiChannel)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
  });

  it("updates Electribe track parameters with MIDI value clamping", () => {
    const pattern = createDefaultPattern();
    const updated = updateTrackElectribeParameter(
      pattern,
      pattern.tracks[0].id,
      "cutoff",
      200,
    );

    expect(updated.tracks[0].electribeParameters.cutoff).toBe(127);
    expect(updated.tracks[0].electribeParameters.resonance).toBe(0);
  });

  it("creates, edits, and deletes notes", () => {
    const pattern = createDefaultPattern();
    const emptyTrack = pattern.tracks[7];
    const created = togglePatternNote(pattern, emptyTrack.id, 3);
    const selected = created.selectedNote;

    expect(selected).not.toBeNull();
    expect(created.pattern.tracks[7].notes).toHaveLength(1);

    const edited = updatePatternNote(created.pattern, selected!, {
      velocity: 2,
      pitch: 200,
    });
    expect(edited.tracks[7].notes[0].velocity).toBe(1);
    expect(edited.tracks[7].notes[0].pitch).toBe(127);

    const deleted = deletePatternNote(edited, selected!);
    expect(deleted.tracks[7].notes).toHaveLength(0);
  });
});
