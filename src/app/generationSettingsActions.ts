import type { GenerationParameters, PreservationSettings } from "../engine/Pattern";

export function setGenerationMutationStrength(
  settings: GenerationParameters,
  mutationStrength: number,
): GenerationParameters {
  return {
    ...settings,
    mutationStrength: clamp(mutationStrength, 0, 1.5),
  };
}

export function setGenerationPreservation(
  settings: GenerationParameters,
  key: keyof PreservationSettings,
  value: number,
): GenerationParameters {
  return {
    ...settings,
    preservation: {
      ...settings.preservation,
      [key]: clamp(Math.round(value), 0, 100),
    },
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
