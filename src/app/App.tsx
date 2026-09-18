import { useEffect, useMemo, useRef } from "react";
import { AudioEngine } from "../audio/AudioEngine";
import { Sequencer } from "../audio/Sequencer";
import { GhostButton } from "../components/GhostButton";
import { MidiPanel } from "../components/MidiPanel";
import { ParameterControls } from "../components/ParameterControls";
import { PatternLibraryPanel } from "../components/PatternLibraryPanel";
import { PatternGrid } from "../components/PatternGrid";
import { Transport } from "../components/Transport";
import { VariationGrid } from "../components/VariationGrid";
import { useGhostStore } from "./store";

export function App() {
  const {
    activePattern,
    sourcePattern,
    variations,
    selectedVariationId,
    isPlaying,
    currentStep,
    compareMode,
    setPlaying,
    setCurrentStep,
    generate,
    selectVariation,
    useSelectedVariation,
    keepA,
    keepB,
    setCompareMode,
    saveActivePattern,
    loadFromStorage,
  } = useGhostStore();
  const acceptSelectedVariation = useSelectedVariation;

  const audio = useMemo(() => new AudioEngine(), []);
  const sequencer = useMemo(() => new Sequencer(), []);
  const patternRef = useRef(activePattern);
  patternRef.current = activePattern;

  useEffect(() => {
    if (!isPlaying) {
      sequencer.stop();
      return;
    }

    void audio.ensureReady().then(() => {
      sequencer.start(patternRef.current, setCurrentStep, (step) => audio.playStep(patternRef.current, step));
    });

    return () => sequencer.stop();
  }, [audio, isPlaying, sequencer, setCurrentStep]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveActivePattern();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "o") {
        event.preventDefault();
        loadFromStorage();
        return;
      }

      if (event.key === " ") {
        event.preventDefault();
        setPlaying(!useGhostStore.getState().isPlaying);
      } else if (event.key.toLowerCase() === "g" || event.key.toLowerCase() === "r") {
        generate();
      } else if (event.key.toLowerCase() === "a") {
        setCompareMode(useGhostStore.getState().compareMode === "A" ? "B" : "A");
      } else if (event.key === "Enter") {
        acceptSelectedVariation();
      } else if (event.key === "Escape") {
        setPlaying(false);
      } else if (/^[1-6]$/.test(event.key)) {
        const variation = useGhostStore.getState().variations[Number(event.key) - 1];
        if (variation) {
          selectVariation(variation.id);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [acceptSelectedVariation, generate, loadFromStorage, saveActivePattern, selectVariation, setCompareMode, setPlaying]);

  return (
    <main className="app-shell">
      <header className="top-strip">
        <div>
          <p className="eyebrow">Generative Pattern Tool</p>
          <h1>GHOST</h1>
        </div>
        <GhostButton onClick={() => generate()} />
      </header>

      <Transport
        isPlaying={isPlaying}
        bpm={activePattern.bpm}
        swing={activePattern.swing}
        onTogglePlay={() => setPlaying(!isPlaying)}
      />

      <ParameterControls pattern={activePattern} />

      <section className="workspace">
        <PatternGrid pattern={activePattern} currentStep={currentStep} />
        <aside className="right-rail">
          <PatternLibraryPanel />
          <div className="ab-panel">
            <div className="segmented">
              <button className={compareMode === "A" ? "active" : ""} onClick={() => setCompareMode("A")}>
                A
              </button>
              <button className={compareMode === "B" ? "active" : ""} onClick={() => setCompareMode("B")}>
                B
              </button>
            </div>
            <div className="ab-actions">
              <button onClick={keepA}>Keep A</button>
              <button onClick={keepB} disabled={!selectedVariationId}>
                Keep B
              </button>
            </div>
            <p>
              A: {sourcePattern.name}
              <br />
              B: {variations.find((variation) => variation.id === selectedVariationId)?.label ?? "None"}
            </p>
          </div>
          <MidiPanel />
        </aside>
      </section>

      <VariationGrid
        variations={variations}
        selectedVariationId={selectedVariationId}
        onSelect={selectVariation}
        onUse={acceptSelectedVariation}
      />
    </main>
  );
}
