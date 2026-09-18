import { create } from "zustand";
import {
  DEFAULT_PRESERVATION,
  type GenerationParameters,
  type Note,
  type Pattern,
  type PatternVariation,
  type PreservationSettings,
  type Track,
} from "../engine/Pattern";
import type { PatternLibrary } from "../storage/PatternStorage";
import {
  generateGhostWorkflow,
  keepSourceWorkflowPattern,
  selectWorkflowVariation,
  setWorkflowCompareMode,
  useSelectedWorkflowVariation,
} from "./ghostWorkflowActions";
import {
  setGenerationMutationStrength,
  setGenerationPreservation,
} from "./generationSettingsActions";
import {
  createLibraryPattern,
  deleteLibraryPattern,
  duplicateLibraryPattern,
  importPatternToLibrary,
  isPatternDirty,
  renameLibraryPattern,
  savePatternToLibrary,
  setActiveLibraryPattern,
} from "./libraryActions";
import {
  deletePatternNote,
  togglePatternNote,
  updatePatternMetadata,
  updatePatternNote,
  updateTrackMapping as updatePatternTrackMapping,
  updateTrackPerformance as updatePatternTrackPerformance,
  type SelectedNoteRef,
} from "./patternActions";
import { loadLibraryState, persistLibrary } from "./storePersistence";
import {
  activateLibraryPatternState,
  refreshActiveLibraryPatternState,
} from "./storeStateActions";

interface GhostState {
  library: PatternLibrary;
  activePattern: Pattern;
  sourcePattern: Pattern;
  variations: PatternVariation[];
  selectedVariationId: string | null;
  isPlaying: boolean;
  currentStep: number;
  compareMode: "A" | "B";
  generationSettings: GenerationParameters;
  selectedNote: SelectedNoteRef | null;
  isDirty(): boolean;
  setPlaying(isPlaying: boolean): void;
  setCurrentStep(step: number): void;
  setMutationStrength(mutationStrength: number): void;
  setPreservation(key: keyof PreservationSettings, value: number): void;
  updatePattern(update: Partial<Pattern>): void;
  updateTrackMapping(trackId: string, update: Pick<Partial<Track>, "name" | "midiChannel">): void;
  updateTrackPerformance(trackId: string, update: Pick<Partial<Track>, "muted" | "solo" | "volume">): void;
  toggleNote(trackId: string, step: number): void;
  selectNote(trackId: string, noteId: string): void;
  updateSelectedNote(update: Partial<Note>): void;
  deleteSelectedNote(): void;
  generate(seed?: string): void;
  selectVariation(id: string): void;
  useSelectedVariation(): void;
  keepA(): void;
  keepB(): void;
  setCompareMode(mode: "A" | "B"): void;
  saveActivePattern(): void;
  loadFromStorage(): void;
  setActivePattern(id: string): void;
  createPattern(): void;
  duplicateActivePattern(): void;
  renameActivePattern(name: string): void;
  deleteActivePattern(): void;
  importPattern(pattern: Pattern): void;
}

const initialLibraryState = loadLibraryState();

export const useGhostStore = create<GhostState>((set, get) => ({
  library: initialLibraryState.library,
  activePattern: initialLibraryState.activePattern,
  sourcePattern: initialLibraryState.sourcePattern,
  variations: [],
  selectedVariationId: null,
  isPlaying: false,
  currentStep: 0,
  compareMode: "A",
  selectedNote: null,
  generationSettings: {
    variationCount: 6,
    mutationStrength: 1,
    preservation: DEFAULT_PRESERVATION,
  },

  isDirty() {
    const state = get();
    return isPatternDirty(state.library, state.activePattern);
  },

  setPlaying(isPlaying) {
    set({ isPlaying });
  },

  setCurrentStep(step) {
    set({ currentStep: step });
  },

  setMutationStrength(mutationStrength) {
    set((state) => ({
      generationSettings: setGenerationMutationStrength(
        state.generationSettings,
        mutationStrength,
      ),
    }));
  },

  setPreservation(key, value) {
    set((state) => ({
      generationSettings: setGenerationPreservation(state.generationSettings, key, value),
    }));
  },

  updatePattern(update) {
    set((state) => {
      const result = updatePatternMetadata(state.activePattern, update, state.selectedNote);
      return {
        activePattern: result.pattern,
        selectedNote: result.selectedNote,
      };
    });
  },

  updateTrackMapping(trackId, update) {
    set((state) => ({
      activePattern: updatePatternTrackMapping(state.activePattern, trackId, update),
    }));
  },

  updateTrackPerformance(trackId, update) {
    set((state) => ({
      activePattern: updatePatternTrackPerformance(state.activePattern, trackId, update),
    }));
  },

  toggleNote(trackId, step) {
    set((state) => {
      const result = togglePatternNote(state.activePattern, trackId, step);
      return { activePattern: result.pattern, selectedNote: result.selectedNote };
    });
  },

  selectNote(trackId, noteId) {
    set({ selectedNote: { trackId, noteId } });
  },

  updateSelectedNote(update) {
    const selectedNote = get().selectedNote;
    if (!selectedNote) {
      return;
    }

    set((state) => ({
      activePattern: updatePatternNote(state.activePattern, selectedNote, update),
    }));
  },

  deleteSelectedNote() {
    const selectedNote = get().selectedNote;
    if (!selectedNote) {
      return;
    }

    set((state) => ({
      selectedNote: null,
      activePattern: deletePatternNote(state.activePattern, selectedNote),
    }));
  },

  generate(seed = Date.now().toString(36)) {
    const workflow = generateGhostWorkflow(get().activePattern, seed, get().generationSettings);
    set({
      ...workflow,
      selectedNote: null,
    });
  },

  selectVariation(id) {
    const workflow = selectWorkflowVariation(get().variations, id);
    if (!workflow) {
      return;
    }
    set({
      ...workflow,
      selectedNote: null,
    });
  },

  useSelectedVariation() {
    const workflow = useSelectedWorkflowVariation(get().variations, get().selectedVariationId);
    if (!workflow) {
      return;
    }

    set({
      ...workflow,
      selectedNote: null,
    });
  },

  keepA() {
    set((state) => ({
      ...keepSourceWorkflowPattern(state.sourcePattern),
      selectedNote: null,
    }));
  },

  keepB() {
    get().useSelectedVariation();
  },

  setCompareMode(mode) {
    set((state) => ({
      ...setWorkflowCompareMode(
        mode,
        state.sourcePattern,
        state.activePattern,
        state.variations,
        state.selectedVariationId,
      ),
      selectedNote: null,
    }));
  },

  saveActivePattern() {
    const state = get();
    const library = savePatternToLibrary(state.library, state.activePattern);
    persistLibrary(library);
    set({ library });
  },

  loadFromStorage() {
    set({ ...loadLibraryState(), selectedNote: null });
  },

  setActivePattern(id) {
    const result = setActiveLibraryPattern(get().library, id);
    if (!result) {
      return;
    }

    persistLibrary(result.library);
    set(activateLibraryPatternState(result.library, result.activePattern));
  },

  createPattern() {
    const result = createLibraryPattern(get().library);
    persistLibrary(result.library);
    set(activateLibraryPatternState(result.library, result.activePattern));
  },

  duplicateActivePattern() {
    const result = duplicateLibraryPattern(get().library, get().activePattern);
    persistLibrary(result.library);
    set(activateLibraryPatternState(result.library, result.activePattern));
  },

  renameActivePattern(name) {
    const result = renameLibraryPattern(get().library, get().activePattern, name);
    if (!result) {
      return;
    }

    persistLibrary(result.library);
    set(refreshActiveLibraryPatternState(result.library, result.activePattern));
  },

  deleteActivePattern() {
    const result = deleteLibraryPattern(get().library, get().activePattern);
    persistLibrary(result.library);
    set(activateLibraryPatternState(result.library, result.activePattern));
  },

  importPattern(pattern) {
    const result = importPatternToLibrary(get().library, pattern);
    persistLibrary(result.library);
    set(activateLibraryPatternState(result.library, result.activePattern));
  },
}));
