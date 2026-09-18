import { useState } from "react";
import { Route } from "lucide-react";
import { useGhostStore } from "../app/store";
import {
  ELECTRIBE_PARAMETERS,
  normalizeElectribeParameters,
} from "../midi/ElectribeParameters";

export function MidiMappingPanel() {
  const activePattern = useGhostStore((state) => state.activePattern);
  const selectedHardwareTrackId = useGhostStore((state) => state.selectedHardwareTrackId);
  const reorderTracks = useGhostStore((state) => state.reorderTracks);
  const updateTrackMapping = useGhostStore((state) => state.updateTrackMapping);
  const updateTrackElectribeParameter = useGhostStore(
    (state) => state.updateTrackElectribeParameter,
  );
  const [draggingTrackId, setDraggingTrackId] = useState<string | null>(null);

  const dropTrack = (draggedTrackId: string, targetIndex: number) => {
    const fromIndex = activePattern.tracks.findIndex((track) => track.id === draggedTrackId);
    if (fromIndex === -1) {
      return;
    }

    reorderTracks(fromIndex, targetIndex);
  };

  return (
    <section className="midi-map-panel">
      <h2>
        <Route size={16} />
        Mapping
      </h2>
      <div className="mapping-header">
        <span />
        <span>Part</span>
        <span>Instrument</span>
        <span>CH</span>
      </div>
      <div className="mapping-rows">
        {activePattern.tracks.map((track, index) => (
          <div
            className={`mapping-row ${draggingTrackId === track.id ? "dragging" : ""} ${selectedHardwareTrackId === track.id ? "hardware-selected" : ""}`}
            key={track.id}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              dropTrack(event.dataTransfer.getData("text/plain"), index);
              setDraggingTrackId(null);
            }}
          >
            <div className="mapping-row-main">
              <span
                className="drag-handle"
                draggable
                aria-label={`Move ${track.name}`}
                title={`Move ${track.name}`}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", track.id);
                  setDraggingTrackId(track.id);
                }}
                onDragEnd={() => setDraggingTrackId(null)}
              >
                ::
              </span>
              <span className="part-pill">P{index + 1}</span>
              <div className="mapping-instrument-cell">
                <input
                  value={track.instrumentName}
                  aria-label={`${track.name} Electribe instrument`}
                  onChange={(event) =>
                    updateTrackMapping(track.id, { instrumentName: event.target.value })
                  }
                />
                <span className="role-pill">{track.instrumentType}</span>
              </div>
              <input
                type="number"
                min="1"
                max="16"
                value={track.midiChannel}
                aria-label={`${track.name} MIDI channel`}
                onChange={(event) =>
                  updateTrackMapping(track.id, { midiChannel: Number(event.target.value) })
                }
              />
            </div>
            <div className="electribe-parameter-grid">
              {ELECTRIBE_PARAMETERS.map((parameter) => {
                const values = normalizeElectribeParameters(track.electribeParameters);
                return (
                  <label key={parameter.id}>
                    <span>
                      {parameter.label}
                      <strong>{values[parameter.id]}</strong>
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="127"
                      value={values[parameter.id]}
                      onChange={(event) =>
                        updateTrackElectribeParameter(
                          track.id,
                          parameter.id,
                          Number(event.target.value),
                        )
                      }
                    />
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p>
        Instrument names identify the Electribe part sound GHOST should target. Local
        audition is only a sketch; drag rows to reorder Electribe part slots.
      </p>
    </section>
  );
}
