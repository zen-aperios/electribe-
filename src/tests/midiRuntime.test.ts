import { describe, expect, it } from "vitest";
import { detectMidiRuntime, createMidiService } from "../midi/MidiRuntime";

describe("MIDI runtime", () => {
  it("detects a web runtime by default", () => {
    expect(detectMidiRuntime({ window: {} })).toBe("web");
  });

  it("detects a Tauri runtime without importing Tauri APIs", () => {
    expect(detectMidiRuntime({ window: { __TAURI_INTERNALS__: {} } })).toBe("tauri");
  });

  it("creates the default MIDI service through the runtime boundary", () => {
    expect(createMidiService()).toEqual(
      expect.objectContaining({
        getOutputs: expect.any(Function),
        connect: expect.any(Function),
        sendPattern: expect.any(Function),
      }),
    );
  });
});
