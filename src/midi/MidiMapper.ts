import { audibleTracks, type Note, type Pattern, type Track } from "../engine/Pattern";

export interface MidiNoteEvent {
  channel: number;
  pitch: number;
  velocity: number;
  startStep: number;
  durationSteps: number;
}

export interface MidiMapping {
  trackId: string;
  midiChannel: number;
  defaultPitch?: number;
}

export function patternToMidiEvents(pattern: Pattern): MidiNoteEvent[] {
  return pattern.tracks.flatMap((track) => track.notes.map((note) => noteToMidiEvent(track, note)));
}

export function patternToAudibleMidiEvents(pattern: Pattern): MidiNoteEvent[] {
  return audibleTracks(pattern).flatMap((track) =>
    track.notes.map((note) => noteToMidiEvent(track, note)),
  );
}

export function noteToMidiEvent(track: Track, note: Note): MidiNoteEvent {
  return {
    channel: track.midiChannel,
    pitch: note.pitch,
    velocity: Math.round(note.velocity * (track.volume ?? 1) * 127),
    startStep: note.step,
    durationSteps: note.duration,
  };
}
