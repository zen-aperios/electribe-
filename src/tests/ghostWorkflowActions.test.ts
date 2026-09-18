import { describe, expect, it } from "vitest";
import { DEFAULT_PRESERVATION, createDefaultPattern } from "../engine/Pattern";
import {
  generateGhostWorkflow,
  keepSourceWorkflowPattern,
  selectWorkflowVariation,
  setWorkflowCompareMode,
  useSelectedWorkflowVariation,
} from "../app/ghostWorkflowActions";

const generationSettings = {
  variationCount: 6,
  mutationStrength: 1,
  preservation: DEFAULT_PRESERVATION,
};

describe("ghost workflow helpers", () => {
  it("generates variations and selects the first one", () => {
    const pattern = createDefaultPattern();
    const workflow = generateGhostWorkflow(pattern, "workflow", generationSettings);

    expect(workflow.variations).toHaveLength(6);
    expect(workflow.selectedVariationId).toBe(workflow.variations[0].id);
    expect(workflow.compareMode).toBe("B");
    expect(workflow.activePattern.id).toBe(workflow.variations[0].pattern.id);
  });

  it("selects a generated variation", () => {
    const workflow = generateGhostWorkflow(createDefaultPattern(), "select", generationSettings);
    const selected = selectWorkflowVariation(workflow.variations, workflow.variations[2].id);

    expect(selected?.selectedVariationId).toBe(workflow.variations[2].id);
    expect(selected?.activePattern.id).toBe(workflow.variations[2].pattern.id);
  });

  it("uses selected variation as the new source pattern", () => {
    const workflow = generateGhostWorkflow(createDefaultPattern(), "use", generationSettings);
    const used = useSelectedWorkflowVariation(workflow.variations, workflow.selectedVariationId);

    expect(used?.variations).toHaveLength(0);
    expect(used?.selectedVariationId).toBeNull();
    expect(used?.compareMode).toBe("A");
    expect(used?.activePattern.name).not.toContain(" / GHOST");
  });

  it("keeps source pattern and clears variations", () => {
    const pattern = createDefaultPattern();
    const kept = keepSourceWorkflowPattern(pattern);

    expect(kept.activePattern.id).toBe(pattern.id);
    expect(kept.variations).toHaveLength(0);
    expect(kept.compareMode).toBe("A");
  });

  it("switches A/B compare mode", () => {
    const workflow = generateGhostWorkflow(createDefaultPattern(), "compare", generationSettings);
    const a = setWorkflowCompareMode(
      "A",
      workflow.sourcePattern,
      workflow.activePattern,
      workflow.variations,
      workflow.selectedVariationId,
    );
    const b = setWorkflowCompareMode(
      "B",
      workflow.sourcePattern,
      workflow.sourcePattern,
      workflow.variations,
      workflow.selectedVariationId,
    );

    expect(a.activePattern.id).toBe(workflow.sourcePattern.id);
    expect(b.activePattern.id).toBe(workflow.variations[0].pattern.id);
  });
});
