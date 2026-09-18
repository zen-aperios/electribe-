import type { Pattern } from "../engine/Pattern";
import { TrackRow } from "./TrackRow";

interface PatternGridProps {
  pattern: Pattern;
  currentStep: number;
}

export function PatternGrid({ pattern, currentStep }: PatternGridProps) {
  const steps = Array.from({ length: pattern.length }, (_, index) => index);

  return (
    <section className="pattern-panel">
      <div className="grid-header" style={{ gridTemplateColumns: `108px repeat(${pattern.length}, minmax(18px, 1fr))` }}>
        <span>{pattern.length} steps</span>
        {steps.map((step) => (
          <span key={step} className={step === currentStep ? "playing" : ""}>
            {step + 1}
          </span>
        ))}
      </div>
      {pattern.tracks.map((track) => (
        <TrackRow key={track.id} track={track} length={pattern.length} currentStep={currentStep} />
      ))}
    </section>
  );
}
