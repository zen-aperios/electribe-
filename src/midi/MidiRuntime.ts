import { WebMidiService, type MidiService } from "./MidiService";
import { TauriMidiService } from "./TauriMidiService";

export type MidiRuntimeKind = "web" | "tauri";

interface RuntimeScope {
  window?: {
    __TAURI_INTERNALS__?: unknown;
  };
}

export function detectMidiRuntime(scope: RuntimeScope = globalThis as RuntimeScope): MidiRuntimeKind {
  return scope.window?.__TAURI_INTERNALS__ ? "tauri" : "web";
}

export function createMidiService(scope: RuntimeScope = globalThis as RuntimeScope): MidiService {
  if (detectMidiRuntime(scope) === "tauri") {
    return new TauriMidiService();
  }

  return new WebMidiService();
}
