import { useEffect, useMemo, useState } from "react";
import { useGhostStore } from "../app/store";
import type { Pattern } from "../engine/Pattern";
import { electribeParameterIdForCc } from "../midi/ElectribeParameters";
import { createMidiService } from "../midi/MidiRuntime";
import type { MidiInputMessage, MidiPortSummary } from "../midi/MidiService";

interface MidiDevicePanelProps {
  pattern: Pattern;
  onStatus(status: string): void;
}

export function MidiDevicePanel({ pattern, onStatus }: MidiDevicePanelProps) {
  const midiService = useMemo(() => createMidiService(), []);
  const updateTrackElectribeParameter = useGhostStore(
    (state) => state.updateTrackElectribeParameter,
  );
  const setSelectedHardwareTrack = useGhostStore((state) => state.setSelectedHardwareTrack);
  const [inputs, setInputs] = useState<MidiPortSummary[]>([]);
  const [outputs, setOutputs] = useState<MidiPortSummary[]>([]);
  const [selectedInputId, setSelectedInputId] = useState("");
  const [selectedOutputId, setSelectedOutputId] = useState("");

  useEffect(() => {
    return () => {
      midiService.disconnectInput();
    };
  }, [midiService]);

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

  const refreshInputs = async () => {
    try {
      const nextInputs = await midiService.getInputs();
      setInputs(nextInputs);
      setSelectedInputId((current) => current || nextInputs[0]?.id || "");
      onStatus(nextInputs.length ? "MIDI inputs found" : "No MIDI inputs found");
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "MIDI input access failed");
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

  const connectInput = async () => {
    if (!selectedInputId) {
      onStatus("Choose a MIDI input");
      return;
    }

    try {
      await midiService.connectInput(selectedInputId, mirrorIncomingMidiMessage);
      onStatus("MIDI input connected for mirror");
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "MIDI input connect failed");
    }
  };

  const mirrorIncomingMidiMessage = (message: MidiInputMessage) => {
    const [status, controller, value] = message.data;
    const messageType = status & 0xf0;
    if (messageType < 0x80 || messageType > 0xe0) {
      return;
    }

    const channel = (status & 0x0f) + 1;
    const track = pattern.tracks.find((candidate) => candidate.midiChannel === channel);
    if (!track) {
      return;
    }

    setSelectedHardwareTrack(track.id);

    if (messageType !== 0xb0 || controller === undefined || value === undefined) {
      onStatus(`${track.name} selected from MIDI`);
      return;
    }

    const parameterId = electribeParameterIdForCc(controller);
    if (!parameterId) {
      onStatus(`${track.name} selected from MIDI`);
      return;
    }

    updateTrackElectribeParameter(track.id, parameterId, value);
    onStatus(`${track.name} ${parameterId} mirrored from MIDI`);
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
          value={selectedInputId}
          onChange={(event) => setSelectedInputId(event.target.value)}
          title="MIDI input"
        >
          <option value="">No input</option>
          {inputs.map((input) => (
            <option key={input.id} value={input.id}>
              {input.name}
            </option>
          ))}
        </select>
        <button onClick={() => void refreshInputs()}>Scan In</button>
      </div>
      <div className="midi-actions">
        <button onClick={() => void connectInput()} disabled={!selectedInputId}>
          Mirror In
        </button>
        <button onClick={() => midiService.disconnectInput()} disabled={!selectedInputId}>
          Stop In
        </button>
      </div>
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
        <button onClick={() => void refreshOutputs()}>Scan Out</button>
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
