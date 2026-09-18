import {
  clonePattern,
  createNote,
  notesEqual,
  type Note,
  type Pattern,
  type Track,
} from "./Pattern";
import { accentVelocity } from "./GrooveEngine";
import { constrainPitchToScale, getScalePitches } from "./MelodyGenerator";
import { densityTarget, isStrongStep, suggestedSteps } from "./RhythmGenerator";
import type { RandomSource } from "./random";

export function mutateVelocity(
  pattern: Pattern,
  strength: number,
  random: RandomSource,
): Pattern {
  return mapNotes(pattern, (note) => ({
    ...note,
    velocity: clamp(note.velocity + (random.next() - 0.5) * strength * 0.5, 0.05, 1),
  }));
}

export function mutateTiming(
  pattern: Pattern,
  strength: number,
  random: RandomSource,
): Pattern {
  return mapNotes(pattern, (note) => ({
    ...note,
    microTiming: clamp((note.microTiming ?? 0) + (random.next() - 0.5) * strength, -0.45, 0.45),
  }));
}

export function mutateDensity(
  pattern: Pattern,
  strength: number,
  random: RandomSource,
): Pattern {
  if (strength <= 0) {
    return clonePattern(pattern);
  }

  const next = clonePattern(pattern);
  next.tracks = next.tracks.map((track) => {
    const removeChance = strength * 0.18;
    const addChance = strength * densityTarget(track.instrumentType);
    const existingSteps = new Set(track.notes.map((note) => note.step));
    const notes = track.notes.filter((note) => {
      if (track.instrumentType === "kick" && isStrongStep(note.step, next)) {
        return true;
      }
      return !random.chance(removeChance);
    });

    const candidates = suggestedSteps(track.instrumentType, next);
    candidates.forEach((step) => {
      if (!existingSteps.has(step) && random.chance(addChance)) {
        notes.push(
          createNote({
            step,
            duration: track.instrumentType === "chord" ? 4 : 1,
            velocity: accentVelocity(step, next, 0.62 + random.next() * 0.25),
            probability: 1,
            pitch: inferPitch(track, next, random),
          }),
        );
      }
    });

    return { ...track, notes: sortNotes(notes, next.length) };
  });

  return next;
}

export function mutatePitch(
  pattern: Pattern,
  strength: number,
  random: RandomSource,
): Pattern {
  const scalePitches = getScalePitches(pattern);
  return mapNotes(pattern, (note, track) => {
    if (!["bass", "lead", "chord", "other"].includes(track.instrumentType)) {
      return note;
    }

    if (!random.chance(strength)) {
      return note;
    }

    const interval = random.pick([-7, -5, -3, 2, 3, 5, 7]);
    return {
      ...note,
      pitch: constrainPitchToScale(note.pitch + interval, pattern, scalePitches[0], scalePitches.at(-1)),
    };
  });
}

export function mutateOctave(
  pattern: Pattern,
  strength: number,
  random: RandomSource,
): Pattern {
  return mapNotes(pattern, (note, track) => {
    if (!["bass", "lead", "chord", "other"].includes(track.instrumentType)) {
      return note;
    }

    if (!random.chance(strength * 0.35)) {
      return note;
    }

    return {
      ...note,
      pitch: clamp(note.pitch + random.pick([-12, 12]), 24, 96),
    };
  });
}

export function mutateDuration(
  pattern: Pattern,
  strength: number,
  random: RandomSource,
): Pattern {
  return mapNotes(pattern, (note, track) => {
    if (["kick", "snare", "hat"].includes(track.instrumentType) || !random.chance(strength)) {
      return note;
    }

    return {
      ...note,
      duration: clamp(Math.round(note.duration + random.pick([-1, 1]) * strength * 2), 1, 8),
    };
  });
}

export function mutateProbability(
  pattern: Pattern,
  strength: number,
  random: RandomSource,
): Pattern {
  return mapNotes(pattern, (note) => ({
    ...note,
    probability: clamp(note.probability - random.next() * strength * 0.35, 0.35, 1),
  }));
}

export function shiftNotes(
  pattern: Pattern,
  strength: number,
  random: RandomSource,
): Pattern {
  if (strength <= 0) {
    return clonePattern(pattern);
  }

  return mapNotes(pattern, (note, track) => {
    const preserveKickDownbeat =
      track.instrumentType === "kick" && note.step % 4 === 0 && random.chance(0.75);
    if (preserveKickDownbeat || !random.chance(strength * 0.35)) {
      return note;
    }

    const shift = random.pick([-2, -1, 1, 2]);
    return { ...note, step: wrap(note.step + shift, pattern.length) };
  });
}

export function addGhostNotes(
  pattern: Pattern,
  strength: number,
  random: RandomSource,
): Pattern {
  if (strength <= 0) {
    return clonePattern(pattern);
  }

  const next = clonePattern(pattern);
  next.tracks = next.tracks.map((track) => {
    const notes = [...track.notes];
    track.notes.forEach((note) => {
      const ghostStep = wrap(note.step + random.pick([-1, 1]), next.length);
      const occupied = notes.some((candidate) => candidate.step === ghostStep);
      if (!occupied && random.chance(strength * 0.22)) {
        notes.push(
          createNote({
            ...note,
            step: ghostStep,
            velocity: clamp(note.velocity * 0.45, 0.05, 0.65),
            probability: 0.72,
          }),
        );
      }
    });

    return { ...track, notes: sortNotes(notes, next.length) };
  });

  return next;
}

export function swapRhythmicCells(
  pattern: Pattern,
  strength: number,
  random: RandomSource,
): Pattern {
  if (strength <= 0 || pattern.length < 8) {
    return clonePattern(pattern);
  }

  const cellSize = 4;
  const cellCount = Math.floor(pattern.length / cellSize);
  if (cellCount < 2) {
    return clonePattern(pattern);
  }

  const firstCell = random.integer(0, cellCount - 1);
  let secondCell = random.integer(0, cellCount - 1);
  if (firstCell === secondCell) {
    secondCell = (secondCell + 1) % cellCount;
  }

  const firstStart = firstCell * cellSize;
  const secondStart = secondCell * cellSize;

  return mapNotes(pattern, (note, track) => {
    if (track.instrumentType === "kick" && isStrongStep(note.step, pattern)) {
      return note;
    }

    if (!random.chance(strength * 0.65)) {
      return note;
    }

    if (note.step >= firstStart && note.step < firstStart + cellSize) {
      return { ...note, step: secondStart + (note.step - firstStart) };
    }

    if (note.step >= secondStart && note.step < secondStart + cellSize) {
      return { ...note, step: firstStart + (note.step - secondStart) };
    }

    return note;
  });
}

export function reversePhrase(
  pattern: Pattern,
  strength: number,
  random: RandomSource,
): Pattern {
  if (strength <= 0) {
    return clonePattern(pattern);
  }

  return mapNotes(pattern, (note, track) => {
    if (["kick", "snare"].includes(track.instrumentType) || !random.chance(strength * 0.45)) {
      return note;
    }

    return { ...note, step: pattern.length - 1 - note.step };
  });
}

export function mirrorPhrase(
  pattern: Pattern,
  strength: number,
  random: RandomSource,
): Pattern {
  if (strength <= 0) {
    return clonePattern(pattern);
  }

  const midpoint = (pattern.length - 1) / 2;
  return mapNotes(pattern, (note, track) => {
    if (!["bass", "lead", "chord", "other"].includes(track.instrumentType)) {
      return note;
    }

    if (!random.chance(strength * 0.45)) {
      return note;
    }

    const mirroredStep = Math.round(midpoint - (note.step - midpoint));
    const mirroredPitch = constrainPitchToScale(120 - note.pitch, pattern);
    return {
      ...note,
      step: wrap(mirroredStep, pattern.length),
      pitch: mirroredPitch,
    };
  });
}

export function applyControlledMutation(
  pattern: Pattern,
  strength: number,
  random: RandomSource,
): Pattern {
  let next = clonePattern(pattern, pattern.name);
  next = mutateVelocity(next, strength, random);
  next = mutateDensity(next, strength, random);
  next = shiftNotes(next, strength, random);
  next = swapRhythmicCells(next, Math.min(1, strength * 0.75), random);
  next = mutatePitch(next, strength, random);
  next = mutateOctave(next, Math.min(1, strength * 0.6), random);
  next = reversePhrase(next, Math.max(0, strength - 0.35), random);
  next = mirrorPhrase(next, Math.max(0, strength - 0.45), random);
  next = mutateDuration(next, strength, random);
  next = mutateProbability(next, Math.min(1, strength * 0.5), random);
  next = addGhostNotes(next, strength, random);
  next = mutateTiming(next, Math.min(1, strength * 0.4), random);

  next.tracks = next.tracks.map((track) => ({
    ...track,
    notes: dedupeNotes(sortNotes(track.notes, next.length)),
  }));

  return next;
}

export function trackSimilarity(left: Track, right: Track): number {
  if (notesEqual(left.notes, right.notes)) {
    return 1;
  }

  const leftSteps = new Set(left.notes.map((note) => `${note.step}:${note.pitch}`));
  const rightSteps = new Set(right.notes.map((note) => `${note.step}:${note.pitch}`));
  const shared = [...leftSteps].filter((step) => rightSteps.has(step)).length;
  const total = Math.max(leftSteps.size, rightSteps.size, 1);
  return shared / total;
}

function mapNotes(
  pattern: Pattern,
  mapper: (note: Note, track: Track) => Note,
): Pattern {
  const next = clonePattern(pattern);
  next.tracks = next.tracks.map((track) => ({
    ...track,
    notes: track.notes.map((note) => mapper(note, track)),
  }));
  return next;
}

function inferPitch(track: Track, pattern: Pattern, random: RandomSource): number {
  if (track.notes[0]) {
    return track.notes[0].pitch;
  }

  if (["bass", "lead", "chord", "other"].includes(track.instrumentType)) {
    return random.pick(getScalePitches(pattern));
  }

  const fallback = { kick: 36, snare: 38, hat: 42, percussion: 45 };
  return fallback[track.instrumentType as keyof typeof fallback] ?? 60;
}

function sortNotes(notes: Note[], length: number): Note[] {
  return notes
    .map((note) => ({ ...note, step: wrap(note.step, length) }))
    .sort((left, right) => left.step - right.step || left.pitch - right.pitch);
}

function dedupeNotes(notes: Note[]): Note[] {
  const seen = new Set<string>();
  return notes.filter((note) => {
    const key = `${note.step}:${note.pitch}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function wrap(value: number, length: number): number {
  return ((value % length) + length) % length;
}
