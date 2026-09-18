import type { Pattern, ScaleName } from "../engine/Pattern";
import { useGhostStore } from "../app/store";

const SCALES: ScaleName[] = ["minor", "major", "dorian", "pentatonic"];
const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

interface ParameterControlsProps {
  pattern: Pattern;
}

export function ParameterControls({ pattern }: ParameterControlsProps) {
  const updatePattern = useGhostStore((state) => state.updatePattern);

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
    </section>
  );
}
