import { invoke } from "@tauri-apps/api/core";
import type { Pattern } from "../engine/Pattern";
import type { MidiPortSummary, MidiService } from "./MidiService";

const NOT_READY_MESSAGE = "Native Tauri MIDI is not wired yet.";

export class TauriMidiService implements MidiService {
  async getInputs(): Promise<MidiPortSummary[]> {
    throw new Error(NOT_READY_MESSAGE);
  }

  async getOutputs(): Promise<MidiPortSummary[]> {
    return invoke<MidiPortSummary[]>("list_midi_outputs");
  }

  async connect(): Promise<void> {
    throw new Error(NOT_READY_MESSAGE);
  }

  disconnect(): void {
    // No native connection is opened until the Tauri MIDI backend exists.
  }

  sendNote(): void {
    throw new Error(NOT_READY_MESSAGE);
  }

  sendCC(): void {
    throw new Error(NOT_READY_MESSAGE);
  }

  sendClock(): void {
    throw new Error(NOT_READY_MESSAGE);
  }

  sendPattern(_pattern: Pattern): void {
    throw new Error(NOT_READY_MESSAGE);
  }
}
