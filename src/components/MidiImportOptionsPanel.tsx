import type { MidiImportLength, MidiImportQuantize } from "../midi/MidiFile";

interface MidiImportOptionsPanelProps {
  importQuantize: MidiImportQuantize;
  importLength: MidiImportLength;
  onQuantizeChange(value: MidiImportQuantize): void;
  onLengthChange(value: MidiImportLength): void;
}

export function MidiImportOptionsPanel({
  importQuantize,
  importLength,
  onQuantizeChange,
  onLengthChange,
}: MidiImportOptionsPanelProps) {
  return (
    <div className="midi-import-options">
      <label>
        Quantize
        <select
          value={importQuantize}
          onChange={(event) => onQuantizeChange(event.target.value as MidiImportQuantize)}
        >
          <option value="1/8">1/8</option>
          <option value="1/16">1/16</option>
          <option value="1/32">1/32</option>
        </select>
      </label>
      <label>
        Length
        <select
          value={importLength}
          onChange={(event) =>
            onLengthChange(
              event.target.value === "auto"
                ? "auto"
                : (Number(event.target.value) as MidiImportLength),
            )
          }
        >
          <option value="auto">Auto</option>
          <option value="8">8</option>
          <option value="16">16</option>
          <option value="32">32</option>
          <option value="64">64</option>
        </select>
      </label>
    </div>
  );
}
