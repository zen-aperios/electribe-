import type { Pattern } from "../engine/Pattern";
import { patternToMidiEvents } from "./MidiMapper";

export interface MidiPortSummary {
  id: string;
  name: string;
}

export interface MidiService {
  getInputs(): Promise<MidiPortSummary[]>;
  getOutputs(): Promise<MidiPortSummary[]>;
  connect(outputId: string): Promise<void>;
  disconnect(): void;
  sendNote(channel: number, pitch: number, velocity: number, durationMs: number): void;
  sendCC(channel: number, controller: number, value: number): void;
  sendClock(): void;
  sendPattern(pattern: Pattern): void;
}

type WebMidiAccess = MIDIAccess & {
  outputs: Map<string, MIDIOutput>;
  inputs: Map<string, MIDIInput>;
};

export class WebMidiService implements MidiService {
  private access: WebMidiAccess | null = null;
  private output: MIDIOutput | null = null;

  async getInputs(): Promise<MidiPortSummary[]> {
    const access = await this.getAccess();
    return [...access.inputs.values()].map(({ id, name }) => ({ id, name: name ?? "MIDI Input" }));
  }

  async getOutputs(): Promise<MidiPortSummary[]> {
    const access = await this.getAccess();
    return [...access.outputs.values()].map(({ id, name }) => ({ id, name: name ?? "MIDI Output" }));
  }

  async connect(outputId: string): Promise<void> {
    const access = await this.getAccess();
    this.output = access.outputs.get(outputId) ?? null;
  }

  disconnect(): void {
    this.output = null;
  }

  sendNote(channel: number, pitch: number, velocity: number, durationMs: number): void {
    if (!this.output) {
      return;
    }

    const midiChannel = Math.max(0, Math.min(15, channel - 1));
    this.output.send([0x90 + midiChannel, pitch, velocity]);
    this.output.send([0x80 + midiChannel, pitch, 0], window.performance.now() + durationMs);
  }

  sendCC(channel: number, controller: number, value: number): void {
    if (!this.output) {
      return;
    }

    const midiChannel = Math.max(0, Math.min(15, channel - 1));
    this.output.send([0xb0 + midiChannel, controller, value]);
  }

  sendClock(): void {
    this.output?.send([0xf8]);
  }

  sendPattern(pattern: Pattern): void {
    patternToMidiEvents(pattern).forEach((event) => {
      this.sendNote(event.channel, event.pitch, event.velocity, event.durationSteps * 125);
    });
  }

  private async getAccess(): Promise<WebMidiAccess> {
    if (this.access) {
      return this.access;
    }

    if (!navigator.requestMIDIAccess) {
      throw new Error("Web MIDI is not supported in this browser.");
    }

    this.access = (await navigator.requestMIDIAccess()) as WebMidiAccess;
    return this.access;
  }
}
