import type { Pattern, ScaleName } from "./Pattern";

const ROOTS: Record<string, number> = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
};

const SCALES: Record<ScaleName, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  pentatonic: [0, 3, 5, 7, 10],
};

export function getScalePitches(pattern: Pattern, low = 36, high = 84): number[] {
  const root = ROOTS[pattern.key] ?? ROOTS.C;
  const scale = SCALES[pattern.scale];
  const pitches: number[] = [];

  for (let pitch = low; pitch <= high; pitch += 1) {
    const interval = (pitch - root + 120) % 12;
    if (scale.includes(interval)) {
      pitches.push(pitch);
    }
  }

  return pitches;
}

export function constrainPitchToScale(
  pitch: number,
  pattern: Pattern,
  low = 36,
  high = 84,
): number {
  const scalePitches = getScalePitches(pattern, low, high);
  return scalePitches.reduce((closest, candidate) =>
    Math.abs(candidate - pitch) < Math.abs(closest - pitch) ? candidate : closest,
  );
}
