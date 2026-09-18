import { Cable } from "lucide-react";
import { useState } from "react";
import { useGhostStore } from "../app/store";
import {
  DEFAULT_MIDI_IMPORT_OPTIONS,
  type MidiImportLength,
  type MidiImportQuantize,
} from "../midi/MidiFile";
import { FileImportExportPanel } from "./FileImportExportPanel";
import { MidiDevicePanel } from "./MidiDevicePanel";
import { MidiImportOptionsPanel } from "./MidiImportOptionsPanel";

export function MidiPanel() {
  const activePattern = useGhostStore((state) => state.activePattern);
  const importPattern = useGhostStore((state) => state.importPattern);
  const [status, setStatus] = useState("Ready");
  const [importQuantize, setImportQuantize] = useState<MidiImportQuantize>(
    DEFAULT_MIDI_IMPORT_OPTIONS.quantize,
  );
  const [importLength, setImportLength] = useState<MidiImportLength>(
    DEFAULT_MIDI_IMPORT_OPTIONS.length,
  );

  return (
    <section className="midi-panel">
      <h2>
        <Cable size={16} />
        MIDI
      </h2>
      <MidiDevicePanel pattern={activePattern} onStatus={setStatus} />
      <FileImportExportPanel
        pattern={activePattern}
        importQuantize={importQuantize}
        importLength={importLength}
        onImportPattern={importPattern}
        onStatus={setStatus}
      />
      <MidiImportOptionsPanel
        importQuantize={importQuantize}
        importLength={importLength}
        onQuantizeChange={setImportQuantize}
        onLengthChange={setImportLength}
      />
      <p>{status}</p>
    </section>
  );
}
