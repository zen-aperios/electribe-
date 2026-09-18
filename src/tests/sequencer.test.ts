import { describe, expect, it } from "vitest";
import { stepDurationSeconds } from "../audio/Sequencer";

describe("Sequencer timing", () => {
  it("calculates sixteenth-note step duration from bpm", () => {
    expect(stepDurationSeconds(120)).toBe(0.125);
    expect(stepDurationSeconds(60)).toBe(0.25);
  });
});
