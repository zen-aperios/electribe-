import { Route } from "lucide-react";
import { useGhostStore } from "../app/store";
import {
  ELECTRIBE_PARAMETERS,
  normalizeElectribeParameters,
} from "../midi/ElectribeParameters";

export function MidiMappingPanel() {
  const activePattern = useGhostStore((state) => state.activePattern);
  const updateTrackMapping = useGhostStore((state) => state.updateTrackMapping);
  const updateTrackElectribeParameter = useGhostStore(
    (state) => state.updateTrackElectribeParameter,
  );

  return (
    <section className="midi-map-panel">
      <h2>
        <Route size={16} />
        Mapping
      </h2>
      <div className="mapping-header">
        <span>Part</span>
        <span>Track</span>
        <span>Role</span>
        <span>CH</span>
      </div>
      <div className="mapping-rows">
        {activePattern.tracks.map((track, index) => (
          <div className="mapping-row" key={track.id}>
            <div className="mapping-row-main">
              <span className="part-pill">P{index + 1}</span>
              <input
                value={track.name}
                aria-label={`${track.name} name`}
                onChange={(event) =>
                  updateTrackMapping(track.id, { name: event.target.value })
                }
              />
              <span className="role-pill">{track.instrumentType}</span>
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
        These values are sent as Electribe MIDI CCs with the pattern. Hardware mirror
        feedback will be marked separately once MIDI input is wired.
      </p>
    </section>
  );
}
