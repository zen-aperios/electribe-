# GHOST

GHOST is a local-first generative pattern tool for Korg Electribe 2 workflows and future MIDI hardware support.

The core interaction is:

```text
CURRENT PATTERN -> GHOST -> MANY POSSIBILITIES
```

Phase 1 focuses on a clean React/TypeScript prototype with a pure algorithmic engine, Web Audio preview, variation cards, JSON save/load, and testable MIDI/pattern conversion boundaries. There is no cloud backend and no external AI API.

The app includes generic MIDI channel mapping today. Electribe-specific part, CC, NRPN, and SysEx behavior is intentionally deferred until it can be verified against hardware.

Patterns support arbitrary step lengths from 1 to 64 steps. Resizing a pattern removes notes outside the new boundary and clamps note durations so exported data remains valid.

## Run

```bash
npm install
npm run dev
```

## Verify

```bash
npm test
npm run build
```

## Project Shape

- `src/app` - application shell and state wiring
- `src/components` - focused UI components
- `src/engine` - pure TypeScript pattern model and generators
- `src/audio` - Web Audio preview engine
- `src/midi` - MIDI service, mapping, and MIDI file conversion boundaries
- `src/storage` - local JSON persistence helpers
- `src/tests` - core engine and persistence tests

## Hardware Notes

Direct Electribe 2 control is intentionally deferred. MIDI channel and part mapping live behind configurable service interfaces so real-device research can happen without rewriting the generator.
