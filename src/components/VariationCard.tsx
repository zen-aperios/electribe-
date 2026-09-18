import type { PatternVariation } from "../engine/Pattern";

interface VariationCardProps {
  variation: PatternVariation;
  selected: boolean;
  onSelect(): void;
  onUse(): void;
}

export function VariationCard({ variation, selected, onSelect, onUse }: VariationCardProps) {
  const previewTracks = variation.pattern.tracks.slice(0, 4);
  const steps = Array.from({ length: Math.min(16, variation.pattern.length) }, (_, index) => index);

  return (
    <article className={`variation-card ${selected ? "selected" : ""}`} onClick={onSelect}>
      <header>
        <strong>{variation.label}</strong>
        <span>{variation.mutationAmount}%</span>
      </header>
      <div className="mini-pattern">
        {previewTracks.map((track) => (
          <div key={track.id}>
            {steps.map((step) => (
              <span key={step} className={track.notes.some((note) => note.step === step) ? "hit" : ""} />
            ))}
          </div>
        ))}
      </div>
      <p>{variation.description}</p>
      <div className="variation-actions">
        <button onClick={(event) => { event.stopPropagation(); onSelect(); }}>Preview</button>
        <button onClick={(event) => { event.stopPropagation(); onUse(); }}>Use</button>
      </div>
    </article>
  );
}
