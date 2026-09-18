import type { PatternVariation } from "../engine/Pattern";
import { VariationCard } from "./VariationCard";

interface VariationGridProps {
  variations: PatternVariation[];
  selectedVariationId: string | null;
  onSelect(id: string): void;
  onUse(): void;
}

export function VariationGrid({ variations, selectedVariationId, onSelect, onUse }: VariationGridProps) {
  return (
    <section className="variation-grid" aria-label="Generated variations">
      {variations.length === 0 ? (
        <div className="empty-variations">Press GHOST to generate six related possibilities.</div>
      ) : (
        variations.map((variation) => (
          <VariationCard
            key={variation.id}
            variation={variation}
            selected={variation.id === selectedVariationId}
            onSelect={() => onSelect(variation.id)}
            onUse={onUse}
          />
        ))
      )}
    </section>
  );
}
