import {
  normalizeElectribeParameters,
  type ElectribeParameterValues,
} from "../midi/ElectribeParameters";

export type InstrumentType =
  | "kick"
  | "snare"
  | "hat"
  | "percussion"
  | "bass"
  | "lead"
  | "chord"
  | "other";

export type ScaleName = "major" | "minor" | "dorian" | "pentatonic";

export interface Note {
  id: string;
  step: number;
  duration: number;
  velocity: number;
  probability: number;
  pitch: number;
  microTiming?: number;
}

export interface Track {
  id: string;
  name: string;
  instrumentName: string;
  midiChannel: number;
  instrumentType: InstrumentType;
  muted: boolean;
  solo: boolean;
  volume: number;
  electribeParameters: ElectribeParameterValues;
  notes: Note[];
}

export interface Pattern {
  id: string;
  name: string;
  bpm: number;
  swing: number;
  length: number;
  resolution: number;
  timeSignature: [number, number];
  key: string;
  scale: ScaleName;
  tracks: Track[];
  createdAt: string;
  updatedAt: string;
}

export interface PreservationSettings {
  kick: number;
  bass: number;
  melody: number;
  groove: number;
  structure: number;
}

export interface GenerationParameters {
  variationCount: number;
  mutationStrength: number;
  preservation: PreservationSettings;
}

export interface PatternVariation {
  id: string;
  label: string;
  seed: string;
  mutationAmount: number;
  description: string;
  pattern: Pattern;
}

export const DEFAULT_PRESERVATION: PreservationSettings = {
  kick: 90,
  bass: 70,
  melody: 50,
  groove: 80,
  structure: 70,
};

export const MIN_PATTERN_LENGTH = 1;
export const MAX_PATTERN_LENGTH = 64;

const now = () => new Date().toISOString();

export function defaultElectribeInstrumentName(partIndex: number): string {
  return `E2 Part ${String(partIndex + 1).padStart(2, "0")} Instrument`;
}

export function createNote(note: Omit<Note, "id"> & { id?: string }): Note {
  return {
    id: note.id ?? cryptoId("note"),
    step: note.step,
    duration: note.duration,
    velocity: note.velocity,
    probability: note.probability,
    pitch: note.pitch,
    microTiming: note.microTiming ?? 0,
  };
}

export function createDefaultPattern(name = "Ghost Pattern 01"): Pattern {
  const createdAt = now();
  const length = 16;
  const tracks: Track[] = [
    makeTrack("kick", "Kick", 1, [0, 4, 8, 12], 36),
    makeTrack("snare", "Snare", 2, [4, 12], 38),
    makeTrack("hat", "Hi-hat", 3, [0, 2, 4, 6, 8, 10, 12, 14], 42, 0.62),
    makeTrack("percussion", "Perc", 4, [3, 7, 11, 15], 45, 0.58),
    makeTrack("bass", "Bass", 5, [0, 6, 8, 14], 48, 0.78, 2),
    makeTrack("lead", "Lead", 6, [2, 5, 9, 13], 60, 0.7, 1),
    makeTrack("chord", "Chord", 7, [0, 8], 64, 0.65, 4),
    makeTrack("other", "Other", 8, [], 72),
  ];

  return {
    id: cryptoId("pattern"),
    name,
    bpm: 124,
    swing: 8,
    length,
    resolution: 16,
    timeSignature: [4, 4],
    key: "D",
    scale: "minor",
    tracks,
    createdAt,
    updatedAt: createdAt,
  };
}

export function clonePattern(pattern: Pattern, name = pattern.name): Pattern {
  const clonedAt = now();
  return {
    ...pattern,
    id: cryptoId("pattern"),
    name,
    tracks: pattern.tracks.map((track) => ({
      ...normalizeTrackPerformance(track),
      id: cryptoId(track.instrumentType),
      notes: track.notes.map((note) => ({ ...note, id: cryptoId("note") })),
    })),
    updatedAt: clonedAt,
  };
}

export function createPatternFromTracks(
  pattern: Omit<Pattern, "id" | "createdAt" | "updatedAt">,
): Pattern {
  const createdAt = now();
  return {
    ...pattern,
    id: cryptoId("pattern"),
    tracks: pattern.tracks.map((track) => ({
      ...normalizeTrackPerformance(track),
      id: track.id || cryptoId(track.instrumentType),
      notes: track.notes.map((note) => createNote(note)),
    })),
    createdAt,
    updatedAt: createdAt,
  };
}

export function normalizePattern(pattern: Pattern): Pattern {
  return {
    ...pattern,
    tracks: pattern.tracks.map((track, index) => ({
      ...normalizeTrackPerformance({
        ...track,
        midiChannel: track.midiChannel ?? index + 1,
      }),
      notes: track.notes.map((note) => createNote(note)),
    })),
  };
}

export function resizePatternLength(pattern: Pattern, length: number): Pattern {
  const nextLength = Math.round(clamp(length, MIN_PATTERN_LENGTH, MAX_PATTERN_LENGTH));
  return {
    ...pattern,
    length: nextLength,
    tracks: pattern.tracks.map((track) => ({
      ...normalizeTrackPerformance(track),
      notes: track.notes
        .filter((note) => note.step < nextLength)
        .map((note) => ({
          ...note,
          duration: Math.min(note.duration, Math.max(1, nextLength - note.step)),
        })),
    })),
    updatedAt: now(),
  };
}

export function validatePattern(pattern: Pattern): boolean {
  return (
    pattern.length > 0 &&
    pattern.bpm > 0 &&
    pattern.tracks.every((track) =>
      track.notes.every(
        (note) =>
          note.step >= 0 &&
          note.step < pattern.length &&
          note.duration > 0 &&
          note.velocity >= 0 &&
          note.velocity <= 1 &&
          note.probability >= 0 &&
          note.probability <= 1 &&
              note.pitch >= 0 &&
              note.pitch <= 127 &&
              (track.volume ?? 1) >= 0 &&
              (track.volume ?? 1) <= 1 &&
              Object.values(normalizeElectribeParameters(track.electribeParameters)).every(
                (value) => value >= 0 && value <= 127,
              ),
      ),
    )
  );
}

export function notesEqual(a: Note[], b: Note[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const normalize = (notes: Note[]) =>
    notes
      .map((note) => ({
        step: note.step,
        duration: note.duration,
        velocity: Number(note.velocity.toFixed(3)),
        probability: Number(note.probability.toFixed(3)),
        pitch: note.pitch,
        microTiming: Number((note.microTiming ?? 0).toFixed(3)),
      }))
      .sort((left, right) => left.step - right.step || left.pitch - right.pitch);

  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}

function makeTrack(
  instrumentType: InstrumentType,
  name: string,
  midiChannel: number,
  steps: number[],
  pitch: number,
  velocity = 0.9,
  duration = 1,
): Track {
  return {
    id: cryptoId(instrumentType),
    name,
    instrumentName: defaultElectribeInstrumentName(midiChannel - 1),
    midiChannel,
    instrumentType,
    muted: false,
    solo: false,
    volume: 1,
    electribeParameters: normalizeElectribeParameters(),
    notes: steps.map((step) =>
      createNote({ step, duration, velocity, probability: 1, pitch }),
    ),
  };
}

export function normalizeTrackPerformance(track: Track): Track {
  return {
    ...track,
    instrumentName:
      track.instrumentName?.trim() || defaultElectribeInstrumentName(track.midiChannel - 1),
    muted: track.muted ?? false,
    solo: track.solo ?? false,
    volume: clamp(track.volume ?? 1, 0, 1),
    electribeParameters: normalizeElectribeParameters(track.electribeParameters),
  };
}

export function audibleTracks(pattern: Pattern): Track[] {
  const normalized = pattern.tracks.map(normalizeTrackPerformance);
  const hasSolo = normalized.some((track) => track.solo);
  return normalized.filter((track) => (hasSolo ? track.solo : !track.muted));
}

export function cryptoId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
