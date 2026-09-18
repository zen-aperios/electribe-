import {
  DEFAULT_PRESERVATION,
  clonePattern,
  type GenerationParameters,
  type Pattern,
  type PatternVariation,
} from "./Pattern";
import { applyControlledMutation, trackSimilarity } from "./PatternMutator";
import { createSeededRandom } from "./random";

const VARIATION_PROFILES = [
  { label: "GHOST 01", description: "Very subtle", strength: 0.12 },
  { label: "GHOST 02", description: "Rhythmic mutation", strength: 0.22 },
  { label: "GHOST 03", description: "Velocity mutation", strength: 0.3 },
  { label: "GHOST 04", description: "Syncopated", strength: 0.42 },
  { label: "GHOST 05", description: "Experimental", strength: 0.58 },
  { label: "GHOST 06", description: "Wild", strength: 0.76 },
];

export function generateVariations(
  pattern: Pattern,
  seed: string,
  parameters: Partial<GenerationParameters> = {},
): PatternVariation[] {
  const options: GenerationParameters = {
    variationCount: parameters.variationCount ?? 6,
    mutationStrength: parameters.mutationStrength ?? 1,
    preservation: {
      ...DEFAULT_PRESERVATION,
      ...parameters.preservation,
    },
  };

  return VARIATION_PROFILES.slice(0, options.variationCount).map((profile, index) => {
    const variationSeed = `${seed}:${index}:${profile.label}`;
    const random = createSeededRandom(variationSeed);
    const strength = Math.min(1, profile.strength * options.mutationStrength);
    let nextPattern = applyControlledMutation(pattern, strength, random);
    nextPattern = applyPreservation(pattern, nextPattern, options, random);
    nextPattern = {
      ...nextPattern,
      name: `${pattern.name} / ${profile.label}`,
      updatedAt: new Date().toISOString(),
    };

    return {
      id: `variation-${index + 1}-${variationSeed}`,
      label: profile.label,
      seed: variationSeed,
      mutationAmount: Math.round(strength * 100),
      description: profile.description,
      pattern: nextPattern,
    };
  });
}

function applyPreservation(
  original: Pattern,
  mutated: Pattern,
  parameters: GenerationParameters,
  random: ReturnType<typeof createSeededRandom>,
): Pattern {
  const next = clonePattern(mutated, mutated.name);

  next.tracks = next.tracks.map((track, index) => {
    const originalTrack = original.tracks[index];
    if (!originalTrack) {
      return track;
    }

    const preservation = preservationForTrack(track.instrumentType, parameters);
    if (random.chance(preservation)) {
      return { ...originalTrack, id: track.id, notes: originalTrack.notes.map((note) => ({ ...note })) };
    }

    const similarity = trackSimilarity(originalTrack, track);
    if (similarity < preservation * 0.55) {
      const stableNotes = originalTrack.notes.filter(() => random.chance(preservation));
      const merged = [...track.notes, ...stableNotes].sort((left, right) => left.step - right.step);
      return { ...track, notes: merged };
    }

    return track;
  });

  return next;
}

function preservationForTrack(
  instrumentType: string,
  parameters: GenerationParameters,
): number {
  const { preservation } = parameters;

  if (instrumentType === "kick") {
    return preservation.kick / 100;
  }

  if (instrumentType === "bass") {
    return preservation.bass / 100;
  }

  if (["lead", "chord"].includes(instrumentType)) {
    return preservation.melody / 100;
  }

  if (["hat", "percussion", "snare"].includes(instrumentType)) {
    return preservation.groove / 100;
  }

  return preservation.structure / 100;
}
