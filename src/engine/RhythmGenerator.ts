import type { InstrumentType, Pattern } from "./Pattern";

const DEFAULT_STEPS: Record<InstrumentType, number[]> = {
  kick: [0, 8, 12],
  snare: [4, 12],
  hat: [0, 2, 4, 6, 8, 10, 12, 14],
  percussion: [3, 7, 11, 15],
  bass: [0, 6, 8, 14],
  lead: [2, 5, 9, 13],
  chord: [0, 8],
  other: [1, 10],
};

export function isStrongStep(step: number, pattern: Pattern): boolean {
  const beatSize = pattern.resolution / pattern.timeSignature[0];
  return step % beatSize === 0;
}

export function suggestedSteps(
  instrumentType: InstrumentType,
  pattern: Pattern,
): number[] {
  const template = DEFAULT_STEPS[instrumentType];
  return template
    .map((step) => step % pattern.length)
    .filter((step, index, steps) => steps.indexOf(step) === index);
}

export function densityTarget(instrumentType: InstrumentType): number {
  switch (instrumentType) {
    case "kick":
      return 0.25;
    case "snare":
      return 0.15;
    case "hat":
      return 0.55;
    case "bass":
      return 0.25;
    case "lead":
    case "percussion":
      return 0.3;
    case "chord":
      return 0.12;
    case "other":
      return 0.18;
  }
}
