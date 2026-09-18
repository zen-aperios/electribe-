import { Cable, FileDown, FileUp } from "lucide-react";
import { useRef, useState } from "react";
import { useGhostStore } from "../app/store";
import {
  exportPatternToMidiBytes,
  importPatternFromMidiBytes,
} from "../midi/MidiFile";
import { exportPatternJson, importPatternJson } from "../storage/PatternStorage";

export function MidiPanel() {
  const activePattern = useGhostStore((state) => state.activePattern);
  const importPattern = useGhostStore((state) => state.importPattern);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const midiInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("Ready");

  const exportJson = () => {
    downloadBytes(
      `${safeFileName(activePattern.name)}.ghost.json`,
      new TextEncoder().encode(exportPatternJson(activePattern)),
      "application/json",
    );
    setStatus("JSON exported");
  };

  const exportMidi = () => {
    downloadBytes(
      `${safeFileName(activePattern.name)}.mid`,
      exportPatternToMidiBytes(activePattern),
      "audio/midi",
    );
    setStatus("MIDI exported");
  };

  const importJson = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    try {
      const pattern = importPatternJson(await file.text());
      importPattern({ ...pattern, name: pattern.name || file.name.replace(/\.ghost\.json$/i, "") });
      setStatus("JSON imported");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "JSON import failed");
    }
  };

  const importMidi = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const pattern = importPatternFromMidiBytes(bytes, file.name.replace(/\.midi?$/i, ""));
      importPattern(pattern);
      setStatus("MIDI imported");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "MIDI import failed");
    }
  };

  return (
    <section className="midi-panel">
      <h2>
        <Cable size={16} />
        Files
      </h2>
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
      <p>{status}</p>
    </section>
  );
}

function downloadBytes(fileName: string, bytes: Uint8Array, type: string): void {
  const copy = new Uint8Array(bytes);
  const blob = new Blob([copy.buffer], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function safeFileName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "ghost-pattern";
}
