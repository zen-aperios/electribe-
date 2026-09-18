import { create } from "zustand";
import {
  clonePattern,
  createDefaultPattern,
  DEFAULT_PRESERVATION,
  type GenerationParameters,
  type Note,
  type Pattern,
  type PatternVariation,
  type PreservationSettings,
  type Track,
} from "../engine/Pattern";
import { generateVariations } from "../engine/PatternGenerator";
import { loadLibrary, saveLibrary, type PatternLibrary } from "../storage/PatternStorage";
import {
  deletePatternNote,
  togglePatternNote,
  updatePatternMetadata,
  updatePatternNote,
  updateTrackMapping as updatePatternTrackMapping,
  updateTrackPerformance as updatePatternTrackPerformance,
  type SelectedNoteRef,
} from "./patternActions";

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

const initialLibrary = safeLoadLibrary();
const initialPattern = initialLibrary.patterns.find(
  (pattern) => pattern.id === initialLibrary.activePatternId,
) ?? initialLibrary.patterns[0] ?? createDefaultPattern();

export const useGhostStore = create<GhostState>((set, get) => ({
  library: initialLibrary,
  activePattern: initialPattern,
  sourcePattern: initialPattern,
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
    const saved = state.library.patterns.find(
      (pattern) => pattern.id === state.activePattern.id,
    );
    return !saved || stablePatternString(saved) !== stablePatternString(state.activePattern);
  },

  setPlaying(isPlaying) {
    set({ isPlaying });
  },

  setCurrentStep(step) {
    set({ currentStep: step });
  },

  setMutationStrength(mutationStrength) {
    set((state) => ({
      generationSettings: {
        ...state.generationSettings,
        mutationStrength: clamp(mutationStrength, 0, 1.5),
      },
    }));
  },

  setPreservation(key, value) {
    set((state) => ({
      generationSettings: {
        ...state.generationSettings,
        preservation: {
          ...state.generationSettings.preservation,
          [key]: clamp(Math.round(value), 0, 100),
        },
      },
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
    const sourcePattern = get().activePattern;
    const variations = generateVariations(sourcePattern, seed, get().generationSettings);
    set({
      sourcePattern,
      variations,
      selectedVariationId: variations[0]?.id ?? null,
      activePattern: variations[0]?.pattern ?? sourcePattern,
      selectedNote: null,
      compareMode: "B",
    });
  },

  selectVariation(id) {
    const variation = get().variations.find((candidate) => candidate.id === id);
    if (!variation) {
      return;
    }
    set({
      selectedVariationId: id,
      activePattern: variation.pattern,
      selectedNote: null,
      compareMode: "B",
    });
  },

  useSelectedVariation() {
    const selected = get().variations.find((variation) => variation.id === get().selectedVariationId);
    if (!selected) {
      return;
    }

    const activePattern = {
      ...selected.pattern,
      name: selected.pattern.name.replace(` / ${selected.label}`, ""),
    };

    set({
      activePattern,
      sourcePattern: activePattern,
      variations: [],
      selectedVariationId: null,
      selectedNote: null,
      compareMode: "A",
    });
  },

  keepA() {
    set((state) => ({
      activePattern: state.sourcePattern,
      variations: [],
      selectedVariationId: null,
      selectedNote: null,
      compareMode: "A",
    }));
  },

  keepB() {
    get().useSelectedVariation();
  },

  setCompareMode(mode) {
    const selected = get().variations.find((variation) => variation.id === get().selectedVariationId);
    set((state) => ({
      compareMode: mode,
      activePattern: mode === "A" ? state.sourcePattern : selected?.pattern ?? state.activePattern,
      selectedNote: null,
    }));
  },

  saveActivePattern() {
    const state = get();
    const patterns = [
      state.activePattern,
      ...state.library.patterns.filter((pattern) => pattern.id !== state.activePattern.id),
    ];
    const library = { activePatternId: state.activePattern.id, patterns };
    saveLibrary(library);
    set({ library });
  },

  loadFromStorage() {
    const library = safeLoadLibrary();
    const activePattern = library.patterns.find((pattern) => pattern.id === library.activePatternId) ?? library.patterns[0];
    set({ library, activePattern, sourcePattern: activePattern, selectedNote: null });
  },

  setActivePattern(id) {
    const pattern = get().library.patterns.find((candidate) => candidate.id === id);
    if (!pattern) {
      return;
    }

    const library = { ...get().library, activePatternId: pattern.id };
    saveLibrary(library);
    set({
      library,
      activePattern: pattern,
      sourcePattern: pattern,
      variations: [],
      selectedVariationId: null,
      selectedNote: null,
      compareMode: "A",
    });
  },

  createPattern() {
    const currentCount = get().library.patterns.length + 1;
    const activePattern = createDefaultPattern(`Ghost Pattern ${String(currentCount).padStart(2, "0")}`);
    const library = {
      activePatternId: activePattern.id,
      patterns: [activePattern, ...get().library.patterns],
    };
    saveLibrary(library);
    set({
      library,
      activePattern,
      sourcePattern: activePattern,
      variations: [],
      selectedVariationId: null,
      selectedNote: null,
      compareMode: "A",
    });
  },

  duplicateActivePattern() {
    const duplicate = clonePattern(get().activePattern, `${get().activePattern.name} Copy`);
    const library = {
      activePatternId: duplicate.id,
      patterns: [duplicate, ...get().library.patterns],
    };
    saveLibrary(library);
    set({
      library,
      activePattern: duplicate,
      sourcePattern: duplicate,
      variations: [],
      selectedVariationId: null,
      selectedNote: null,
      compareMode: "A",
    });
  },

  renameActivePattern(name) {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    const activePattern = {
      ...get().activePattern,
      name: trimmed,
      updatedAt: new Date().toISOString(),
    };
    const library = upsertPattern(get().library, activePattern);
    saveLibrary(library);
    set({ library, activePattern, sourcePattern: activePattern, selectedNote: null });
  },

  deleteActivePattern() {
    const state = get();
    const remaining = state.library.patterns.filter(
      (pattern) => pattern.id !== state.activePattern.id,
    );
    const activePattern = remaining[0] ?? createDefaultPattern("Ghost Pattern 01");
    const library = {
      activePatternId: activePattern.id,
      patterns: remaining.length ? remaining : [activePattern],
    };
    saveLibrary(library);
    set({
      library,
      activePattern,
      sourcePattern: activePattern,
      variations: [],
      selectedVariationId: null,
      selectedNote: null,
      compareMode: "A",
    });
  },

  importPattern(pattern) {
    const library = {
      activePatternId: pattern.id,
      patterns: [pattern, ...get().library.patterns.filter((candidate) => candidate.id !== pattern.id)],
    };
    saveLibrary(library);
    set({
      library,
      activePattern: pattern,
      sourcePattern: pattern,
      variations: [],
      selectedVariationId: null,
      selectedNote: null,
      compareMode: "A",
    });
  },
}));

function safeLoadLibrary(): PatternLibrary {
  if (typeof localStorage === "undefined") {
    const activePattern = createDefaultPattern();
    return { activePatternId: activePattern.id, patterns: [activePattern] };
  }

  return loadLibrary();
}

function upsertPattern(library: PatternLibrary, pattern: Pattern): PatternLibrary {
  return {
    activePatternId: pattern.id,
    patterns: [
      pattern,
      ...library.patterns.filter((candidate) => candidate.id !== pattern.id),
    ],
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function stablePatternString(pattern: Pattern): string {
  return JSON.stringify({
    ...pattern,
    updatedAt: undefined,
    createdAt: undefined,
  });
}
