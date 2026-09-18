import type { Pattern, PreservationSettings, ScaleName } from "../engine/Pattern";
import { useGhostStore } from "../app/store";

const SCALES: ScaleName[] = ["minor", "major", "dorian", "pentatonic"];
const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const PRESERVATION_CONTROLS: Array<{
  key: keyof PreservationSettings;
  label: string;
}> = [
  { key: "kick", label: "Kick" },
  { key: "bass", label: "Bass" },
  { key: "melody", label: "Melody" },
  { key: "groove", label: "Groove" },
  { key: "structure", label: "Structure" },
];

interface ParameterControlsProps {
  pattern: Pattern;
}

export function ParameterControls({ pattern }: ParameterControlsProps) {
  const updatePattern = useGhostStore((state) => state.updatePattern);
  const generationSettings = useGhostStore((state) => state.generationSettings);
  const setMutationStrength = useGhostStore((state) => state.setMutationStrength);
  const setPreservation = useGhostStore((state) => state.setPreservation);

  return (
    <section className="parameter-strip">
      <label>
        BPM
        <input
          type="number"
          min="40"
          max="240"
          value={pattern.bpm}
          onChange={(event) => updatePattern({ bpm: Number(event.target.value) })}
        />
      </label>
      <label>
        Swing
        <input
          type="range"
          min="0"
          max="55"
          value={pattern.swing}
          onChange={(event) => updatePattern({ swing: Number(event.target.value) })}
        />
      </label>
      <label>
        Length
        <select
          value={pattern.length}
          onChange={(event) => updatePattern({ length: Number(event.target.value) })}
        >
          {[8, 16, 32, 64].map((length) => (
            <option key={length} value={length}>
              {length}
            </option>
          ))}
        </select>
      </label>
      <label>
        Key
        <select value={pattern.key} onChange={(event) => updatePattern({ key: event.target.value })}>
          {KEYS.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </label>
      <label>
        Scale
        <select
          value={pattern.scale}
          onChange={(event) => updatePattern({ scale: event.target.value as ScaleName })}
        >
          {SCALES.map((scale) => (
            <option key={scale} value={scale}>
              {scale}
            </option>
          ))}
        </select>
      </label>
      <label className="wide-control">
        Mutate {Math.round(generationSettings.mutationStrength * 100)}%
        <input
          type="range"
          min="0"
          max="150"
          value={Math.round(generationSettings.mutationStrength * 100)}
          onChange={(event) => setMutationStrength(Number(event.target.value) / 100)}
        />
      </label>
      <div className="preservation-controls">
        {PRESERVATION_CONTROLS.map((control) => (
          <label key={control.key}>
            {control.label} {generationSettings.preservation[control.key]}%
            <input
              type="range"
              min="0"
              max="100"
              value={generationSettings.preservation[control.key]}
              onChange={(event) => setPreservation(control.key, Number(event.target.value))}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
