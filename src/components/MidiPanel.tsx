import { Cable, FileDown, FileUp } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useGhostStore } from "../app/store";
import {
  DEFAULT_MIDI_IMPORT_OPTIONS,
  exportPatternToMidiBytes,
  importPatternFromMidiBytes,
  type MidiImportLength,
  type MidiImportQuantize,
} from "../midi/MidiFile";
import { WebMidiService, type MidiPortSummary } from "../midi/MidiService";
import { exportPatternJson, importPatternJson } from "../storage/PatternStorage";

export function MidiPanel() {
  const activePattern = useGhostStore((state) => state.activePattern);
  const importPattern = useGhostStore((state) => state.importPattern);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const midiInputRef = useRef<HTMLInputElement>(null);
  const midiService = useMemo(() => new WebMidiService(), []);
  const [outputs, setOutputs] = useState<MidiPortSummary[]>([]);
  const [selectedOutputId, setSelectedOutputId] = useState("");
  const [status, setStatus] = useState("Ready");
  const [importQuantize, setImportQuantize] = useState<MidiImportQuantize>(
    DEFAULT_MIDI_IMPORT_OPTIONS.quantize,
  );
  const [importLength, setImportLength] = useState<MidiImportLength>(
    DEFAULT_MIDI_IMPORT_OPTIONS.length,
  );

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
      const pattern = importPatternFromMidiBytes(bytes, file.name.replace(/\.midi?$/i, ""), {
        quantize: importQuantize,
        length: importLength,
      });
      importPattern(pattern);
      setStatus("MIDI imported");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "MIDI import failed");
    }
  };

  const refreshOutputs = async () => {
    try {
      const nextOutputs = await midiService.getOutputs();
      setOutputs(nextOutputs);
      setSelectedOutputId((current) => current || nextOutputs[0]?.id || "");
      setStatus(nextOutputs.length ? "MIDI outputs found" : "No MIDI outputs found");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "MIDI access failed");
    }
  };

  const connectOutput = async () => {
    if (!selectedOutputId) {
      setStatus("Choose a MIDI output");
      return;
    }

    try {
      await midiService.connect(selectedOutputId);
      setStatus("MIDI output connected");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "MIDI connect failed");
    }
  };

  const sendPattern = () => {
    try {
      midiService.sendPattern(activePattern);
      setStatus("Pattern sent to MIDI output");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "MIDI send failed");
    }
  };

  return (
    <section className="midi-panel">
      <h2>
        <Cable size={16} />
        MIDI
      </h2>
      <div className="midi-output-row">
        <select
          value={selectedOutputId}
          onChange={(event) => setSelectedOutputId(event.target.value)}
          title="MIDI output"
        >
          <option value="">No output</option>
          {outputs.map((output) => (
            <option key={output.id} value={output.id}>
              {output.name}
            </option>
          ))}
        </select>
        <button onClick={() => void refreshOutputs()}>Scan</button>
      </div>
      <div className="midi-actions">
        <button onClick={() => void connectOutput()} disabled={!selectedOutputId}>
          Connect
        </button>
        <button onClick={sendPattern} disabled={!selectedOutputId}>
          Send
        </button>
      </div>
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
      <div className="midi-import-options">
        <label>
          Quantize
          <select
            value={importQuantize}
            onChange={(event) => setImportQuantize(event.target.value as MidiImportQuantize)}
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
              setImportLength(
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
