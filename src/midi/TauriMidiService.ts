import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { Pattern } from "../engine/Pattern";
import { patternToAudibleMidiEvents, patternToMidiControlEvents } from "./MidiMapper";
import type { MidiInputMessage, MidiPortSummary, MidiService } from "./MidiService";

export class TauriMidiService implements MidiService {
  private unlistenInput: UnlistenFn | null = null;

  async getInputs(): Promise<MidiPortSummary[]> {
    return invoke<MidiPortSummary[]>("list_midi_inputs");
  }

  async getOutputs(): Promise<MidiPortSummary[]> {
    return invoke<MidiPortSummary[]>("list_midi_outputs");
  }

  async connect(outputId: string): Promise<void> {
    await invoke("connect_midi_output", { outputId });
  }

  async connectInput(
    inputId: string,
    onMessage: (message: MidiInputMessage) => void,
  ): Promise<void> {
    this.disconnectInput();
    this.unlistenInput = await listen<MidiInputMessage>(
      "midi-input-message",
      (event) => onMessage(event.payload),
    );
    await invoke("connect_midi_input", { inputId });
  }

  disconnectInput(): void {
    this.unlistenInput?.();
    this.unlistenInput = null;
    void invoke("disconnect_midi_input");
  }

  disconnect(): void {
    void invoke("disconnect_midi_output");
  }

  sendNote(channel: number, pitch: number, velocity: number, durationMs: number): void {
    const safeChannel = clamp(Math.round(channel), 1, 16);
    const safePitch = clamp(Math.round(pitch), 0, 127);
    void invoke("send_midi_note", {
      channel: safeChannel,
      pitch: safePitch,
      velocity: clamp(Math.round(velocity), 0, 127),
    });
    window.setTimeout(() => {
      void invoke("send_midi_note_off", { channel: safeChannel, pitch: safePitch });
    }, Math.max(0, durationMs));
  }

  sendCC(channel: number, controller: number, value: number): void {
    void invoke("send_midi_cc", {
      channel: clamp(Math.round(channel), 1, 16),
      controller: clamp(Math.round(controller), 0, 127),
      value: clamp(Math.round(value), 0, 127),
    });
  }

  sendClock(): void {
    void invoke("send_midi_clock");
  }

  sendPattern(pattern: Pattern): void {
    const stepDurationMs = (60_000 / pattern.bpm) / 4;
    patternToMidiControlEvents(pattern).forEach((event) => {
      this.sendCC(event.channel, event.controller, event.value);
    });
    patternToAudibleMidiEvents(pattern).forEach((event) => {
      window.setTimeout(() => {
        this.sendNote(
          event.channel,
          event.pitch,
          event.velocity,
          event.durationSteps * stepDurationMs,
        );
      }, event.startStep * stepDurationMs);
    });
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
