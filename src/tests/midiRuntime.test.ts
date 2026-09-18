import { beforeEach, describe, expect, it, vi } from "vitest";
import { detectMidiRuntime, createMidiService } from "../midi/MidiRuntime";
import { TauriMidiService } from "../midi/TauriMidiService";
import { WebMidiService } from "../midi/MidiService";

const { invoke } = vi.hoisted(() => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke,
}));

beforeEach(() => {
  invoke.mockReset();
});

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

  it("lists MIDI outputs through the Tauri command bridge", async () => {
    invoke.mockResolvedValue([{ id: "0", name: "Electribe 2" }]);

    await expect(new TauriMidiService().getOutputs()).resolves.toEqual([
      { id: "0", name: "Electribe 2" },
    ]);
    expect(invoke).toHaveBeenCalledWith("list_midi_outputs");
  });

  it("fails loudly for native MIDI sends until they are wired", () => {
    expect(() => new TauriMidiService().sendClock()).toThrow(
      "Native Tauri MIDI is not wired yet.",
    );
  });
});
