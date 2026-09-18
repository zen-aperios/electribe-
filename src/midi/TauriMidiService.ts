import { invoke } from "@tauri-apps/api/core";
import type { Pattern } from "../engine/Pattern";
import { patternToAudibleMidiEvents } from "./MidiMapper";
import type { MidiPortSummary, MidiService } from "./MidiService";

const NOT_READY_MESSAGE = "Native Tauri MIDI is not wired yet.";

export class TauriMidiService implements MidiService {
  async getInputs(): Promise<MidiPortSummary[]> {
    throw new Error(NOT_READY_MESSAGE);
  }

  async getOutputs(): Promise<MidiPortSummary[]> {
    return invoke<MidiPortSummary[]>("list_midi_outputs");
  }

  async connect(outputId: string): Promise<void> {
    await invoke("connect_midi_output", { outputId });
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
