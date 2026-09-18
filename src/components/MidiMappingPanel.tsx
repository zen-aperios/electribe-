import { Route } from "lucide-react";
import { useGhostStore } from "../app/store";

export function MidiMappingPanel() {
  const activePattern = useGhostStore((state) => state.activePattern);
  const updateTrackMapping = useGhostStore((state) => state.updateTrackMapping);

  return (
    <section className="midi-map-panel">
      <h2>
        <Route size={16} />
        Mapping
      </h2>
      <div className="mapping-header">
        <span>Track</span>
        <span>CH</span>
      </div>
      <div className="mapping-rows">
        {activePattern.tracks.map((track) => (
          <div className="mapping-row" key={track.id}>
            <input
              value={track.name}
              aria-label={`${track.name} name`}
              onChange={(event) =>
                updateTrackMapping(track.id, { name: event.target.value })
              }
            />
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
        ))}
      </div>
      <p>Electribe part mappings stay configurable until hardware behavior is verified.</p>
    </section>
  );
}
