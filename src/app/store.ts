import { create } from "zustand";
import { createDefaultPattern, type Pattern, type PatternVariation } from "../engine/Pattern";
import { generateVariations } from "../engine/PatternGenerator";
import { loadLibrary, saveLibrary, type PatternLibrary } from "../storage/PatternStorage";

interface GhostState {
  library: PatternLibrary;
  activePattern: Pattern;
  sourcePattern: Pattern;
  variations: PatternVariation[];
  selectedVariationId: string | null;
  isPlaying: boolean;
  currentStep: number;
  compareMode: "A" | "B";
  setPlaying(isPlaying: boolean): void;
  setCurrentStep(step: number): void;
  updatePattern(update: Partial<Pattern>): void;
  toggleNote(trackId: string, step: number): void;
  generate(seed?: string): void;
  selectVariation(id: string): void;
  useSelectedVariation(): void;
  keepA(): void;
  keepB(): void;
  setCompareMode(mode: "A" | "B"): void;
  saveActivePattern(): void;
  loadFromStorage(): void;
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

  setPlaying(isPlaying) {
    set({ isPlaying });
  },

  setCurrentStep(step) {
    set({ currentStep: step });
  },

  updatePattern(update) {
    set((state) => ({
      activePattern: {
        ...state.activePattern,
        ...update,
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  toggleNote(trackId, step) {
    set((state) => {
      const activePattern = {
        ...state.activePattern,
        tracks: state.activePattern.tracks.map((track) => {
          if (track.id !== trackId) {
            return track;
          }

          const existing = track.notes.find((note) => note.step === step);
          if (existing) {
            return {
              ...track,
              notes: track.notes.filter((note) => note.id !== existing.id),
            };
          }

          const pitch = track.notes[0]?.pitch ?? 60;
          return {
            ...track,
            notes: [
              ...track.notes,
              {
                id: `note-${track.id}-${step}-${Date.now()}`,
                step,
                duration: track.instrumentType === "chord" ? 4 : 1,
                velocity: step % 4 === 0 ? 0.9 : 0.7,
                probability: 1,
                pitch,
                microTiming: 0,
              },
            ].sort((left, right) => left.step - right.step),
          };
        }),
        updatedAt: new Date().toISOString(),
      };

      return { activePattern };
    });
  },

  generate(seed = Date.now().toString(36)) {
    const sourcePattern = get().activePattern;
    const variations = generateVariations(sourcePattern, seed);
    set({
      sourcePattern,
      variations,
      selectedVariationId: variations[0]?.id ?? null,
      activePattern: variations[0]?.pattern ?? sourcePattern,
      compareMode: "B",
    });
  },

  selectVariation(id) {
    const variation = get().variations.find((candidate) => candidate.id === id);
    if (!variation) {
      return;
    }
    set({ selectedVariationId: id, activePattern: variation.pattern, compareMode: "B" });
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
      compareMode: "A",
    });
  },

  keepA() {
    set((state) => ({
      activePattern: state.sourcePattern,
      variations: [],
      selectedVariationId: null,
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
    set({ library, activePattern, sourcePattern: activePattern });
  },
}));

function safeLoadLibrary(): PatternLibrary {
  if (typeof localStorage === "undefined") {
    const activePattern = createDefaultPattern();
    return { activePatternId: activePattern.id, patterns: [activePattern] };
  }

  return loadLibrary();
}
