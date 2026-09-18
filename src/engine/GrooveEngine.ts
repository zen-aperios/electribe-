import type { Note, Pattern } from "./Pattern";

export function applySwingToMicroTiming(note: Note, pattern: Pattern): Note {
  if (pattern.swing <= 0 || note.step % 2 === 0) {
    return note;
  }

  return {
    ...note,
    microTiming: (note.microTiming ?? 0) + pattern.swing / 100,
  };
}

export function accentVelocity(step: number, pattern: Pattern, velocity: number): number {
  const downbeat = step % 4 === 0;
  const accented = downbeat ? velocity + 0.14 : velocity;
  return Math.max(0.05, Math.min(1, accented));
}
