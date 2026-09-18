import { describe, expect, it } from "vitest";
import { detectMidiRuntime, createMidiService } from "../midi/MidiRuntime";
import { TauriMidiService } from "../midi/TauriMidiService";
import { WebMidiService } from "../midi/MidiService";

describe("MIDI runtime", () => {
  it("detects a web runtime by default", () => {
    expect(detectMidiRuntime({ window: {} })).toBe("web");
  });

  it("detects a Tauri runtime without importing Tauri APIs", () => {
    expect(detectMidiRuntime({ window: { __TAURI_INTERNALS__: {} } })).toBe("tauri");
  });

  it("creates a Web MIDI service for web runtime", () => {
    expect(createMidiService({ window: {} })).toBeInstanceOf(WebMidiService);
  });

  it("creates a Tauri MIDI service for Tauri runtime", () => {
    expect(createMidiService({ window: { __TAURI_INTERNALS__: {} } })).toBeInstanceOf(
      TauriMidiService,
    );
  });

  it("fails loudly until native Tauri MIDI is wired", async () => {
    await expect(new TauriMidiService().getOutputs()).rejects.toThrow(
      "Native Tauri MIDI is not wired yet.",
    );
  });
});
