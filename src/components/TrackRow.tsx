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
  const selectedNote = useGhostStore((state) => state.selectedNote);
  const updateTrackPerformance = useGhostStore((state) => state.updateTrackPerformance);
  const steps = Array.from({ length }, (_, index) => index);
  const notesByStep = new Map(track.notes.map((note) => [note.step, note]));
  const muted = track.muted ?? false;
  const solo = track.solo ?? false;
  const volume = track.volume ?? 1;

  return (
    <div className={`track-row ${muted ? "muted" : ""} ${solo ? "solo" : ""}`} style={{ gridTemplateColumns: `168px repeat(${length}, minmax(18px, 1fr))` }}>
      <div className="track-label">
        <div className="track-title">
          <strong>{track.name}</strong>
          <span>CH {track.midiChannel}</span>
        </div>
        <div className="track-performance">
          <button
            className={muted ? "active" : ""}
            onClick={() => updateTrackPerformance(track.id, { muted: !muted })}
            title={`${muted ? "Unmute" : "Mute"} ${track.name}`}
          >
            M
          </button>
          <button
            className={solo ? "active" : ""}
            onClick={() => updateTrackPerformance(track.id, { solo: !solo })}
            title={`${solo ? "Unsolo" : "Solo"} ${track.name}`}
          >
            S
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(volume * 100)}
            onChange={(event) =>
              updateTrackPerformance(track.id, { volume: Number(event.target.value) / 100 })
            }
            title={`${track.name} volume`}
          />
        </div>
      </div>
      {steps.map((step) => {
        const note = notesByStep.get(step);
        const selected =
          Boolean(note && selectedNote) &&
          note?.id === selectedNote?.noteId &&
          track.id === selectedNote?.trackId;
        return (
          <button
            key={step}
            className={`step ${note ? "on" : ""} ${selected ? "selected" : ""} ${step === currentStep ? "playing" : ""}`}
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
