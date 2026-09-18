import { FileDown, FileUp } from "lucide-react";
import { useRef } from "react";
import type { Pattern } from "../engine/Pattern";
import {
  exportPatternToMidiBytes,
  importPatternFromMidiBytes,
  type MidiImportLength,
  type MidiImportQuantize,
} from "../midi/MidiFile";
import { exportPatternJson, importPatternJson } from "../storage/PatternStorage";
import { downloadBytes, safeFileName } from "../utils/download";

interface FileImportExportPanelProps {
  pattern: Pattern;
  importQuantize: MidiImportQuantize;
  importLength: MidiImportLength;
  onImportPattern(pattern: Pattern): void;
  onStatus(status: string): void;
}

export function FileImportExportPanel({
  pattern,
  importQuantize,
  importLength,
  onImportPattern,
  onStatus,
}: FileImportExportPanelProps) {
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const midiInputRef = useRef<HTMLInputElement>(null);

  const exportJson = () => {
    downloadBytes(
      `${safeFileName(pattern.name)}.ghost.json`,
      new TextEncoder().encode(exportPatternJson(pattern)),
      "application/json",
    );
    onStatus("JSON exported");
  };

  const exportMidi = () => {
    downloadBytes(
      `${safeFileName(pattern.name)}.mid`,
      exportPatternToMidiBytes(pattern),
      "audio/midi",
    );
    onStatus("MIDI exported");
  };

  const importJson = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    try {
      const nextPattern = importPatternJson(await file.text());
      onImportPattern({
        ...nextPattern,
        name: nextPattern.name || file.name.replace(/\.ghost\.json$/i, ""),
      });
      onStatus("JSON imported");
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "JSON import failed");
    }
  };

  const importMidi = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const nextPattern = importPatternFromMidiBytes(
        bytes,
        file.name.replace(/\.midi?$/i, ""),
        {
          quantize: importQuantize,
          length: importLength,
        },
      );
      onImportPattern(nextPattern);
      onStatus("MIDI imported");
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "MIDI import failed");
    }
  };

  return (
    <>
      <div className="file-actions">
        <button onClick={exportJson} title="Export JSON">
          <FileDown size={15} />
          JSON
        </button>
        <button onClick={() => jsonInputRef.current?.click()} title="Import JSON">
          <FileUp size={15} />
          JSON
        </button>
        <button onClick={exportMidi} title="Export MIDI">
          <FileDown size={15} />
          MIDI
        </button>
        <button onClick={() => midiInputRef.current?.click()} title="Import MIDI">
          <FileUp size={15} />
          MIDI
        </button>
      </div>
      <input
        ref={jsonInputRef}
        className="hidden-file"
        type="file"
        accept=".json,.ghost.json,application/json"
        onChange={(event) => void importJson(event.target.files?.[0])}
      />
      <input
        ref={midiInputRef}
        className="hidden-file"
        type="file"
        accept=".mid,.midi,audio/midi"
        onChange={(event) => void importMidi(event.target.files?.[0])}
      />
    </>
  );
}
