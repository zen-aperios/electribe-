import type { Pattern } from "../engine/Pattern";
import type { PatternLibrary } from "../storage/PatternStorage";
import type { GhostWorkflowState } from "./ghostWorkflowActions";
import type { SelectedNoteRef } from "./patternActions";

export interface ActiveLibraryPatternState extends GhostWorkflowState {
  library: PatternLibrary;
  selectedNote: SelectedNoteRef | null;
}

export function activateLibraryPatternState(
  library: PatternLibrary,
  activePattern: Pattern,
): ActiveLibraryPatternState {
  return {
    library,
    activePattern,
    sourcePattern: activePattern,
    variations: [],
    selectedVariationId: null,
    selectedNote: null,
    compareMode: "A",
  };
}

export function refreshActiveLibraryPatternState(
  library: PatternLibrary,
  activePattern: Pattern,
): Pick<ActiveLibraryPatternState, "library" | "activePattern" | "sourcePattern" | "selectedNote"> {
  return {
    library,
    activePattern,
    sourcePattern: activePattern,
    selectedNote: null,
  };
}
