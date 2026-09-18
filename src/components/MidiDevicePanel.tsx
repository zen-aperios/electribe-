import { useMemo, useState } from "react";
import type { Pattern } from "../engine/Pattern";
import { WebMidiService, type MidiPortSummary } from "../midi/MidiService";

interface MidiDevicePanelProps {
  pattern: Pattern;
  onStatus(status: string): void;
}

export function MidiDevicePanel({ pattern, onStatus }: MidiDevicePanelProps) {
  const midiService = useMemo(() => new WebMidiService(), []);
  const [outputs, setOutputs] = useState<MidiPortSummary[]>([]);
  const [selectedOutputId, setSelectedOutputId] = useState("");

  const refreshOutputs = async () => {
    try {
      const nextOutputs = await midiService.getOutputs();
      setOutputs(nextOutputs);
      setSelectedOutputId((current) => current || nextOutputs[0]?.id || "");
      onStatus(nextOutputs.length ? "MIDI outputs found" : "No MIDI outputs found");
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "MIDI access failed");
    }
  };

  const connectOutput = async () => {
    if (!selectedOutputId) {
      onStatus("Choose a MIDI output");
      return;
    }

    try {
      await midiService.connect(selectedOutputId);
      onStatus("MIDI output connected");
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "MIDI connect failed");
    }
  };

  const sendPattern = () => {
    try {
      midiService.sendPattern(pattern);
      onStatus("Pattern sent to MIDI output");
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "MIDI send failed");
    }
  };

  return (
    <>
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
    </>
  );
}
