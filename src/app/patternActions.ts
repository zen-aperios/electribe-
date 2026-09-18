import type { ElectribeParameterId } from "../midi/ElectribeParameters";
import { normalizeElectribeParameters } from "../midi/ElectribeParameters";
import { resizePatternLength, type Note, type Pattern, type Track } from "../engine/Pattern";

export interface SelectedNoteRef {
  trackId: string;
  noteId: string;
}

export interface PatternEditResult {
  pattern: Pattern;
  selectedNote: SelectedNoteRef | null;
}

export function updatePatternMetadata(
  pattern: Pattern,
  update: Partial<Pattern>,
  selectedNote: SelectedNoteRef | null,
): PatternEditResult {
  return {
    pattern:
      update.length === undefined
        ? {
            ...pattern,
            ...update,
            updatedAt: new Date().toISOString(),
          }
        : resizePatternLength({ ...pattern, ...update }, update.length),
    selectedNote: update.length === undefined ? selectedNote : null,
  };
}

export function updateTrackMapping(
  pattern: Pattern,
  trackId: string,
  update: Pick<Partial<Track>, "name" | "midiChannel">,
): Pattern {
  return {
    ...pattern,
    tracks: pattern.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            ...update,
            name: update.name ?? track.name,
            midiChannel:
              update.midiChannel === undefined
                ? track.midiChannel
                : Math.round(clamp(update.midiChannel, 1, 16)),
          }
        : track,
    ),
    updatedAt: new Date().toISOString(),
  };
}

export function updateTrackPerformance(
  pattern: Pattern,
  trackId: string,
  update: Pick<Partial<Track>, "muted" | "solo" | "volume">,
): Pattern {
  return {
    ...pattern,
    tracks: pattern.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            ...update,
            muted: update.muted ?? track.muted ?? false,
            solo: update.solo ?? track.solo ?? false,
            volume:
              update.volume === undefined ? track.volume ?? 1 : clamp(update.volume, 0, 1),
          }
        : track,
    ),
    updatedAt: new Date().toISOString(),
  };
}

export function updateTrackElectribeParameter(
  pattern: Pattern,
  trackId: string,
  parameterId: ElectribeParameterId,
  value: number,
): Pattern {
  return {
    ...pattern,
    tracks: pattern.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            electribeParameters: normalizeElectribeParameters({
              ...track.electribeParameters,
              [parameterId]: value,
            }),
          }
        : track,
    ),
    updatedAt: new Date().toISOString(),
  };
}

export function togglePatternNote(pattern: Pattern, trackId: string, step: number): PatternEditResult {
  let selectedNote: SelectedNoteRef | null = null;
  const nextPattern = {
    ...pattern,
    tracks: pattern.tracks.map((track) => {
      if (track.id !== trackId) {
        return track;
      }

      const existing = track.notes.find((note) => note.step === step);
      if (existing) {
        selectedNote = { trackId, noteId: existing.id };
        return track;
      }

      const pitch = track.notes[0]?.pitch ?? 60;
      const note = {
        id: `note-${track.id}-${step}-${Date.now()}`,
        step,
        duration: track.instrumentType === "chord" ? 4 : 1,
        velocity: step % 4 === 0 ? 0.9 : 0.7,
        probability: 1,
        pitch,
        microTiming: 0,
      };
      selectedNote = { trackId, noteId: note.id };
      return {
        ...track,
        notes: [...track.notes, note].sort((left, right) => left.step - right.step),
      };
    }),
    updatedAt: new Date().toISOString(),
  };

  return { pattern: nextPattern, selectedNote };
}

export function updatePatternNote(
  pattern: Pattern,
  selectedNote: SelectedNoteRef,
  update: Partial<Note>,
): Pattern {
  return {
    ...pattern,
    tracks: pattern.tracks.map((track) => {
      if (track.id !== selectedNote.trackId) {
        return track;
      }

      return {
        ...track,
        notes: track.notes
          .map((note) =>
            note.id === selectedNote.noteId
              ? sanitizeNote({ ...note, ...update }, pattern.length)
              : note,
          )
          .sort((left, right) => left.step - right.step),
      };
    }),
    updatedAt: new Date().toISOString(),
  };
}

export function deletePatternNote(pattern: Pattern, selectedNote: SelectedNoteRef): Pattern {
  return {
    ...pattern,
    tracks: pattern.tracks.map((track) =>
      track.id === selectedNote.trackId
        ? {
            ...track,
            notes: track.notes.filter((note) => note.id !== selectedNote.noteId),
          }
        : track,
    ),
    updatedAt: new Date().toISOString(),
  };
}

function sanitizeNote(note: Note, patternLength: number): Note {
  return {
    ...note,
    step: Math.round(clamp(note.step, 0, patternLength - 1)),
    duration: Math.round(clamp(note.duration, 1, patternLength)),
    velocity: clamp(note.velocity, 0.01, 1),
    probability: clamp(note.probability, 0, 1),
    pitch: Math.round(clamp(note.pitch, 0, 127)),
    microTiming: clamp(note.microTiming ?? 0, -0.45, 0.45),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
