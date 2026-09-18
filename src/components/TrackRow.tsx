import type { CSSProperties } from "react";
import { useGhostStore } from "../app/store";
import type { Track } from "../engine/Pattern";

interface TrackRowProps {
  track: Track;
  length: number;
  currentStep: number;
}

export function TrackRow({ track, length, currentStep }: TrackRowProps) {
  const toggleNote = useGhostStore((state) => state.toggleNote);
  const steps = Array.from({ length }, (_, index) => index);
  const notesByStep = new Map(track.notes.map((note) => [note.step, note]));

  return (
    <div className="track-row" style={{ gridTemplateColumns: `108px repeat(${length}, minmax(18px, 1fr))` }}>
      <div className="track-label">
        <strong>{track.name}</strong>
        <span>CH {track.midiChannel}</span>
      </div>
      {steps.map((step) => {
        const note = notesByStep.get(step);
        return (
          <button
            key={step}
            className={`step ${note ? "on" : ""} ${step === currentStep ? "playing" : ""}`}
            onClick={() => toggleNote(track.id, step)}
            title={`${track.name} step ${step + 1}`}
            style={note ? ({ "--velocity": note.velocity } as CSSProperties) : undefined}
          >
            <span />
          </button>
        );
      })}
    </div>
  );
}
