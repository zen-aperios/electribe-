import type { Pattern } from "../engine/Pattern";
import { patternToMidiEvents } from "./MidiMapper";

export interface SimpleMidiExport {
  name: string;
  bpm: number;
  ticksPerStep: number;
  events: ReturnType<typeof patternToMidiEvents>;
}

export function exportPatternToMidiData(pattern: Pattern): SimpleMidiExport {
  return {
    name: pattern.name,
    bpm: pattern.bpm,
    ticksPerStep: 120,
    events: patternToMidiEvents(pattern),
  };
}

export function importPatternFromMidiData(): never {
  throw new Error("MIDI file import is planned for the next phase.");
}
