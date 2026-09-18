import { WebMidiService, type MidiService } from "./MidiService";

export type MidiRuntimeKind = "web" | "tauri";

interface RuntimeScope {
  window?: {
    __TAURI_INTERNALS__?: unknown;
  };
}

export function detectMidiRuntime(scope: RuntimeScope = globalThis as RuntimeScope): MidiRuntimeKind {
  return scope.window?.__TAURI_INTERNALS__ ? "tauri" : "web";
}

export function createMidiService(): MidiService {
  return new WebMidiService();
}
