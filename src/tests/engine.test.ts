import { describe, expect, it } from "vitest";
import { createDefaultPattern, createNote, notesEqual, validatePattern } from "../engine/Pattern";
import { generateVariations } from "../engine/PatternGenerator";
import {
  mirrorPhrase,
  mutateDensity,
  swapRhythmicCells,
} from "../engine/PatternMutator";
import { createSeededRandom } from "../engine/random";
import { getScalePitches } from "../engine/MelodyGenerator";
import { patternToMidiEvents } from "../midi/MidiMapper";
import {
  exportPatternToMidiBytes,
  importPatternFromMidiBytes,
} from "../midi/MidiFile";
import { exportPatternJson, importPatternJson } from "../storage/PatternStorage";

describe("GHOST engine", () => {
  it("generates valid patterns", () => {
    const pattern = createDefaultPattern();
    const variations = generateVariations(pattern, "seed-a");

    expect(variations).toHaveLength(6);
    expect(variations.every((variation) => validatePattern(variation.pattern))).toBe(true);
  });

  it("is deterministic for a seed", () => {
    const pattern = createDefaultPattern();
    const first = generateVariations(pattern, "same-seed");
    const second = generateVariations(pattern, "same-seed");

    expect(stripIds(first)).toEqual(stripIds(second));
  });

  it("does not mutate density at strength 0", () => {
    const pattern = createDefaultPattern();
    const mutated = mutateDensity(pattern, 0, createSeededRandom("zero"));

    pattern.tracks.forEach((track, index) => {
      expect(notesEqual(track.notes, mutated.tracks[index].notes)).toBe(true);
    });
  });

  it("mutates at strength 1 where possible", () => {
    const pattern = createDefaultPattern();
    const mutated = mutateDensity(pattern, 1, createSeededRandom("full"));
    const changed = pattern.tracks.some((track, index) => !notesEqual(track.notes, mutated.tracks[index].notes));

    expect(changed).toBe(true);
  });

  it("can swap rhythmic cells while keeping notes valid", () => {
    const pattern = createDefaultPattern();
    const swapped = swapRhythmicCells(pattern, 1, createSeededRandom("cells"));

    expect(validatePattern(swapped)).toBe(true);
    expect(
      swapped.tracks.some((track, index) => !notesEqual(track.notes, pattern.tracks[index].notes)),
    ).toBe(true);
  });

  it("can mirror melodic phrases inside the selected scale", () => {
    const pattern = createDefaultPattern();
    const mirrored = mirrorPhrase(pattern, 1, createSeededRandom("mirror"));
    const scalePitches = new Set(getScalePitches(pattern));
    const melodicNotes = mirrored.tracks
      .filter((track) => ["bass", "lead", "chord", "other"].includes(track.instrumentType))
      .flatMap((track) => track.notes);

    expect(validatePattern(mirrored)).toBe(true);
    expect(melodicNotes.every((note) => scalePitches.has(note.pitch))).toBe(true);
  });

  it("keeps generated melodic notes inside the scale", () => {
    const pattern = createDefaultPattern();
    const variation = generateVariations(pattern, "scale-test")[5].pattern;
    const scalePitches = new Set(getScalePitches(pattern));

    const melodicNotes = variation.tracks
      .filter((track) => ["bass", "lead", "chord", "other"].includes(track.instrumentType))
      .flatMap((track) => track.notes);

    expect(melodicNotes.every((note) => scalePitches.has(note.pitch))).toBe(true);
  });

  it("keeps pattern length valid", () => {
    const pattern = { ...createDefaultPattern(), length: 32 };
    const variation = generateVariations(pattern, "length-test")[0].pattern;

    expect(variation.length).toBe(32);
    expect(variation.tracks.every((track) => track.notes.every((note) => note.step < 32))).toBe(true);
  });

  it("preserves kick tracks when preservation is high", () => {
    const pattern = createDefaultPattern();
    const variation = generateVariations(pattern, "preserve", {
      preservation: { kick: 100, bass: 0, melody: 0, groove: 0, structure: 0 },
    })[5].pattern;

    expect(notesEqual(pattern.tracks[0].notes, variation.tracks[0].notes)).toBe(true);
  });

  it("scales variation mutation amount from generation parameters", () => {
    const pattern = createDefaultPattern();
    const subtle = generateVariations(pattern, "strength", { mutationStrength: 0.5 });
    const intense = generateVariations(pattern, "strength", { mutationStrength: 1.5 });

    expect(subtle[5].mutationAmount).toBe(38);
    expect(intense[5].mutationAmount).toBe(100);
  });

  it("converts patterns to MIDI note events", () => {
    const pattern = createDefaultPattern();
    const events = patternToMidiEvents(pattern);

    expect(events.length).toBeGreaterThan(0);
    expect(events.every((event) => event.channel >= 1 && event.channel <= 16)).toBe(true);
  });

  it("exports and imports MIDI bytes", () => {
    const pattern = createDefaultPattern();
    const bytes = exportPatternToMidiBytes(pattern);
    const imported = importPatternFromMidiBytes(bytes, "Round Trip");

    expect(bytes.length).toBeGreaterThan(20);
    expect(imported.name).toBe("Round Trip");
    expect(imported.bpm).toBe(pattern.bpm);
    expect(imported.tracks.some((track) => track.notes.length > 0)).toBe(true);
    expect(imported.tracks[0].notes[0].step).toBe(pattern.tracks[0].notes[0].step);
  });

  it("merges overflow MIDI tracks into the eighth internal track", () => {
    const pattern = createDefaultPattern();
    const overflowPitch = 91;
    const bytes = exportPatternToMidiBytes({
      ...pattern,
      tracks: [
        ...pattern.tracks,
        {
          id: "overflow-track",
          name: "Overflow",
          midiChannel: 9,
          instrumentType: "other",
          notes: [
            createNote({
              step: 5,
              duration: 1,
              velocity: 0.8,
              probability: 1,
              pitch: overflowPitch,
            }),
          ],
        },
      ],
    });
    const imported = importPatternFromMidiBytes(bytes, "Overflow MIDI");

    expect(imported.tracks).toHaveLength(8);
    expect(imported.tracks[7].notes.some((note) => note.pitch === overflowPitch)).toBe(true);
  });

  it("round trips JSON save/load", () => {
    const pattern = createDefaultPattern();
    const json = exportPatternJson(pattern);
    const imported = importPatternJson(json);

    expect(imported).toEqual(pattern);
  });
});

function stripIds(value: unknown): unknown {
  return JSON.parse(
    JSON.stringify(value, (key, item) => {
      if (key === "id" || key === "createdAt" || key === "updatedAt") {
        return undefined;
      }
      return item;
    }),
  );
}
