import { beforeEach, describe, expect, it, vi } from "vitest";
import { detectMidiRuntime, createMidiService } from "../midi/MidiRuntime";
import { TauriMidiService } from "../midi/TauriMidiService";
import { WebMidiService } from "../midi/MidiService";
import { createDefaultPattern } from "../engine/Pattern";

const { invoke } = vi.hoisted(() => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke,
}));

beforeEach(() => {
  invoke.mockReset();
  vi.useRealTimers();
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

  it("connects and disconnects through the Tauri command bridge", async () => {
    const service = new TauriMidiService();

    await service.connect("2");
    service.disconnect();

    expect(invoke).toHaveBeenCalledWith("connect_midi_output", { outputId: "2" });
    expect(invoke).toHaveBeenCalledWith("disconnect_midi_output");
  });

  it("sends native MIDI note on and note off messages", () => {
    vi.useFakeTimers();

    new TauriMidiService().sendNote(1, 64, 100, 250);

    expect(invoke).toHaveBeenCalledWith("send_midi_note", {
      channel: 1,
      pitch: 64,
      velocity: 100,
    });
    expect(invoke).not.toHaveBeenCalledWith("send_midi_note_off", {
      channel: 1,
      pitch: 64,
    });

    vi.advanceTimersByTime(250);

    expect(invoke).toHaveBeenCalledWith("send_midi_note_off", {
      channel: 1,
      pitch: 64,
    });
  });

  it("sends native MIDI CC and clock messages", () => {
    const service = new TauriMidiService();

    service.sendCC(10, 74, 90);
    service.sendClock();

    expect(invoke).toHaveBeenCalledWith("send_midi_cc", {
      channel: 10,
      controller: 74,
      value: 90,
    });
    expect(invoke).toHaveBeenCalledWith("send_midi_clock");
  });

  it("schedules step-pattern events through native MIDI", () => {
    vi.useFakeTimers();
    const pattern = createDefaultPattern();

    new TauriMidiService().sendPattern(pattern);

    vi.advanceTimersByTime(0);

    expect(invoke).toHaveBeenCalledWith(
      "send_midi_note",
      expect.objectContaining({
        channel: pattern.tracks[0].midiChannel,
        pitch: pattern.tracks[0].notes[0].pitch,
      }),
    );
  });
});
