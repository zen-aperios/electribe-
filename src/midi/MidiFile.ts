import { parseMidi, writeMidi, type MidiData, type MidiEvent } from "midi-file";
import {
  createNote,
  createPatternFromTracks,
  normalizeTrackPerformance,
  type InstrumentType,
  type Note,
  type Pattern,
  type Track,
} from "../engine/Pattern";
import { normalizeElectribeParameters } from "./ElectribeParameters";
import { patternToMidiEvents } from "./MidiMapper";

const TICKS_PER_BEAT = 480;
const TICKS_PER_STEP = 120;
const TRACK_TYPES: InstrumentType[] = [
  "kick",
  "snare",
  "hat",
  "percussion",
  "bass",
  "lead",
  "chord",
  "other",
];
const TRACK_NAMES = ["Kick", "Snare", "Hi-hat", "Perc", "Bass", "Lead", "Chord", "Other"];

export type MidiImportQuantize = "1/8" | "1/16" | "1/32";
export type MidiImportLength = "auto" | 8 | 16 | 32 | 64;

export interface MidiImportOptions {
  quantize: MidiImportQuantize;
  length: MidiImportLength;
}

export const DEFAULT_MIDI_IMPORT_OPTIONS: MidiImportOptions = {
  quantize: "1/16",
  length: "auto",
};

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
    ticksPerStep: TICKS_PER_STEP,
    events: patternToMidiEvents(pattern),
  };
}

export function exportPatternToMidiBytes(pattern: Pattern): Uint8Array {
  const tracks: MidiEvent[][] = [
    [
      { deltaTime: 0, meta: true, type: "trackName", text: pattern.name },
      {
        deltaTime: 0,
        meta: true,
        type: "setTempo",
        microsecondsPerBeat: Math.round(60_000_000 / pattern.bpm),
      },
      {
        deltaTime: 0,
        meta: true,
        type: "timeSignature",
        numerator: pattern.timeSignature[0],
        denominator: pattern.timeSignature[1],
        metronome: 24,
        thirtyseconds: 8,
      },
      { deltaTime: 0, meta: true, type: "endOfTrack" },
    ],
  ];

  pattern.tracks.forEach((track) => {
    const absoluteEvents = track.notes.flatMap((note) => {
      const startTick = Math.round(note.step * TICKS_PER_STEP);
      const endTick = startTick + Math.max(1, Math.round(note.duration * TICKS_PER_STEP));
      const channel = Math.max(0, Math.min(15, track.midiChannel - 1));
      return [
        {
          tick: startTick,
          event: {
            deltaTime: 0,
            type: "noteOn",
            channel,
            noteNumber: note.pitch,
            velocity: Math.round(note.velocity * 127),
          } satisfies MidiEvent,
        },
        {
          tick: endTick,
          event: {
            deltaTime: 0,
            type: "noteOff",
            channel,
            noteNumber: note.pitch,
            velocity: 0,
          } satisfies MidiEvent,
        },
      ];
    });

    absoluteEvents.sort((left, right) => left.tick - right.tick);

    let previousTick = 0;
    const midiTrack: MidiEvent[] = [
      { deltaTime: 0, meta: true, type: "trackName", text: track.name },
      ...absoluteEvents.map(({ tick, event }) => {
        const deltaTime = Math.max(0, tick - previousTick);
        previousTick = tick;
        return { ...event, deltaTime };
      }),
      { deltaTime: 0, meta: true, type: "endOfTrack" },
    ];

    tracks.push(midiTrack);
  });

  const midi: MidiData = {
    header: {
      format: 1,
      numTracks: tracks.length,
      ticksPerBeat: TICKS_PER_BEAT,
    },
    tracks,
  };

  return Uint8Array.from(writeMidi(midi, { useByte9ForNoteOff: false }));
}

export function importPatternFromMidiBytes(
  bytes: ArrayLike<number>,
  name = "Imported MIDI",
  options: Partial<MidiImportOptions> = {},
): Pattern {
  const importOptions = { ...DEFAULT_MIDI_IMPORT_OPTIONS, ...options };
  const midi = parseMidi(bytes);
  const ticksPerBeat = midi.header.ticksPerBeat ?? TICKS_PER_BEAT;
  const quantizeTicks = ticksPerBeat / quantizeDivisor(importOptions.quantize);
  const stepsPerSixteenth = quantizeTicks / (ticksPerBeat / 4);
  let bpm = 124;
  const tracks: Track[] = [];

  midi.tracks.forEach((midiTrack, trackIndex) => {
    const active = new Map<string, { tick: number; velocity: number }>();
    const notes: Note[] = [];
    let absoluteTick = 0;
    let trackName = TRACK_NAMES[trackIndex - 1] ?? `Track ${trackIndex}`;

    midiTrack.forEach((event) => {
      absoluteTick += event.deltaTime;

      if (event.type === "trackName") {
        trackName = event.text;
      }

      if (event.type === "setTempo") {
        bpm = Math.round(60_000_000 / event.microsecondsPerBeat);
      }

      if (event.type === "noteOn" && event.velocity > 0) {
        active.set(`${event.channel}:${event.noteNumber}`, {
          tick: absoluteTick,
          velocity: event.velocity,
        });
      }

      const noteOff =
        event.type === "noteOff" || (event.type === "noteOn" && event.velocity === 0);
      if (noteOff) {
        const key = `${event.channel}:${event.noteNumber}`;
        const started = active.get(key);
        if (!started) {
          return;
        }

        active.delete(key);
        const step = Math.max(0, Math.round(started.tick / quantizeTicks) * stepsPerSixteenth);
        const duration = Math.max(
          stepsPerSixteenth,
          Math.round((absoluteTick - started.tick) / quantizeTicks) * stepsPerSixteenth,
        );
        notes.push(
          createNote({
            step,
            duration,
            velocity: Math.max(0.05, Math.min(1, started.velocity / 127)),
            probability: 1,
            pitch: event.noteNumber,
          }),
        );
      }
    });

    if (notes.length > 0) {
      const index = tracks.length;
      tracks.push({
        id: `midi-track-${index + 1}`,
        name: trackName,
        midiChannel: inferMidiChannel(midiTrack) + 1,
        instrumentType: TRACK_TYPES[index] ?? "other",
        muted: false,
        solo: false,
        volume: 1,
        electribeParameters: normalizeElectribeParameters(),
        notes,
      });
    }
  });

  if (!tracks.length) {
    throw new Error("No MIDI note events were found.");
  }

  const maxStep = Math.max(
    ...tracks.flatMap((track) => track.notes.map((note) => note.step + note.duration)),
  );
  const length =
    importOptions.length === "auto" ? nearestPatternLength(maxStep) : importOptions.length;

  return createPatternFromTracks({
    name,
    bpm,
    swing: 0,
    length,
    resolution: 16,
    timeSignature: [4, 4],
    key: "C",
    scale: "minor",
    tracks: normalizeImportedTracks(tracks, length),
  });
}

function inferMidiChannel(events: MidiEvent[]): number {
  const channelEvent = events.find(
    (event) => "channel" in event && typeof event.channel === "number",
  );
  return channelEvent && "channel" in channelEvent ? channelEvent.channel : 0;
}

function nearestPatternLength(steps: number): number {
  return [8, 16, 32, 64].find((length) => steps <= length) ?? 64;
}

function quantizeDivisor(quantize: MidiImportQuantize): number {
  if (quantize === "1/8") {
    return 2;
  }

  if (quantize === "1/32") {
    return 8;
  }

  return 4;
}

function normalizeImportedTracks(tracks: Track[], length: number): Track[] {
  const normalized = tracks.slice(0, 8);
  const overflow = tracks.slice(8);
  if (overflow.length > 0) {
    const otherIndex = 7;
    const otherTrack = normalized[otherIndex] ?? {
      id: "midi-track-8",
      name: TRACK_NAMES[otherIndex],
      midiChannel: otherIndex + 1,
      instrumentType: TRACK_TYPES[otherIndex],
      muted: false,
      solo: false,
      volume: 1,
      electribeParameters: normalizeElectribeParameters(),
      notes: [],
    };

    normalized[otherIndex] = {
      ...otherTrack,
      name: "Other",
      notes: [...otherTrack.notes, ...overflow.flatMap((track) => track.notes)],
    };
  }

  const padded = [...normalized];
  while (padded.length < 8) {
    const index = padded.length;
    padded.push({
      id: `empty-track-${index + 1}`,
      name: TRACK_NAMES[index],
      midiChannel: index + 1,
      instrumentType: TRACK_TYPES[index],
      muted: false,
      solo: false,
      volume: 1,
      electribeParameters: normalizeElectribeParameters(),
      notes: [],
    });
  }

  return padded.map((track) => ({
    ...normalizeTrackPerformance(track),
    instrumentType: TRACK_TYPES[padded.indexOf(track)] ?? "other",
    notes: dedupeImportedNotes(
      track.notes
        .filter((note) => note.step < length)
        .sort((left, right) => left.step - right.step || left.pitch - right.pitch),
    ),
  }));
}

function dedupeImportedNotes(notes: Note[]): Note[] {
  const seen = new Set<string>();
  return notes.filter((note) => {
    const key = `${note.step}:${note.pitch}:${note.duration}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
