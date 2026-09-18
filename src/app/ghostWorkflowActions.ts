import type { GenerationParameters, Pattern, PatternVariation } from "../engine/Pattern";
import { generateVariations } from "../engine/PatternGenerator";

export interface GhostWorkflowState {
  activePattern: Pattern;
  sourcePattern: Pattern;
  variations: PatternVariation[];
  selectedVariationId: string | null;
  compareMode: "A" | "B";
}

export function generateGhostWorkflow(
  activePattern: Pattern,
  seed: string,
  generationSettings: GenerationParameters,
): GhostWorkflowState {
  const sourcePattern = activePattern;
  const variations = generateVariations(sourcePattern, seed, generationSettings);
  return {
    sourcePattern,
    variations,
    selectedVariationId: variations[0]?.id ?? null,
    activePattern: variations[0]?.pattern ?? sourcePattern,
    compareMode: "B",
  };
}

export function selectWorkflowVariation(
  variations: PatternVariation[],
  id: string,
): Pick<GhostWorkflowState, "activePattern" | "selectedVariationId" | "compareMode"> | null {
  const variation = variations.find((candidate) => candidate.id === id);
  if (!variation) {
    return null;
  }

  return {
    selectedVariationId: id,
    activePattern: variation.pattern,
    compareMode: "B",
  };
}

export function useSelectedWorkflowVariation(
  variations: PatternVariation[],
  selectedVariationId: string | null,
): GhostWorkflowState | null {
  const selected = variations.find((variation) => variation.id === selectedVariationId);
  if (!selected) {
    return null;
  }

  const activePattern = {
    ...selected.pattern,
    name: selected.pattern.name.replace(` / ${selected.label}`, ""),
  };

  return {
    activePattern,
    sourcePattern: activePattern,
    variations: [],
    selectedVariationId: null,
    compareMode: "A",
  };
}

export function keepSourceWorkflowPattern(sourcePattern: Pattern): GhostWorkflowState {
  return {
    activePattern: sourcePattern,
    sourcePattern,
    variations: [],
    selectedVariationId: null,
    compareMode: "A",
  };
}

export function setWorkflowCompareMode(
  mode: "A" | "B",
  sourcePattern: Pattern,
  activePattern: Pattern,
  variations: PatternVariation[],
  selectedVariationId: string | null,
): Pick<GhostWorkflowState, "activePattern" | "compareMode"> {
  const selected = variations.find((variation) => variation.id === selectedVariationId);
  return {
    compareMode: mode,
    activePattern: mode === "A" ? sourcePattern : selected?.pattern ?? activePattern,
  };
}
