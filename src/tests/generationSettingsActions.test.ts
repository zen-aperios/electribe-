import { describe, expect, it } from "vitest";
import { DEFAULT_PRESERVATION } from "../engine/Pattern";
import {
  setGenerationMutationStrength,
  setGenerationPreservation,
} from "../app/generationSettingsActions";

const settings = {
  variationCount: 6,
  mutationStrength: 1,
  preservation: DEFAULT_PRESERVATION,
};

describe("generation settings helpers", () => {
  it("clamps mutation strength", () => {
    expect(setGenerationMutationStrength(settings, 2).mutationStrength).toBe(1.5);
    expect(setGenerationMutationStrength(settings, -1).mutationStrength).toBe(0);
  });

  it("clamps preservation percentages", () => {
    expect(setGenerationPreservation(settings, "kick", 150).preservation.kick).toBe(100);
    expect(setGenerationPreservation(settings, "kick", -5).preservation.kick).toBe(0);
  });
});
