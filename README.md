# GHOST

GHOST is a local-first generative pattern tool for Korg Electribe 2 workflows and future MIDI hardware support.

The core interaction is:

```text
CURRENT PATTERN -> GHOST -> MANY POSSIBILITIES
```

Phase 1 focuses on a clean React/TypeScript application with a pure algorithmic engine, Web Audio preview, variation cards, JSON save/load, and testable MIDI/pattern conversion boundaries. There is no cloud backend and no external AI API.

The app includes generic MIDI channel mapping today. Electribe-specific part, CC, NRPN, and SysEx behavior is intentionally deferred until it can be verified against hardware.

Patterns support arbitrary step lengths from 1 to 64 steps. Resizing a pattern removes notes outside the new boundary and clamps note durations so exported data remains valid.

Each track has performance controls for mute, solo, and volume. Audio preview and live Web MIDI output respect those controls; MIDI file export keeps the full pattern data.

MIDI import supports quantization at 1/8, 1/16, or 1/32 and can either auto-detect pattern length or force 8, 16, 32, or 64 steps.

## Run

```bash
npm install
npm run dev
```

## Verify

```bash
npm run lint
npm test
npm run build
```

## Desktop Shell

The repo includes a Tauri 2 shell scaffold for desktop packaging. Native MIDI is routed through a placeholder adapter until the Rust-side MIDI backend is implemented.

```bash
npm run desktop:dev
npm run desktop:build
```

Desktop commands require the Tauri native toolchain, including Rust/Cargo and platform build tools.

## Project Shape

- `src/app` - application shell and state wiring
- `src/components` - focused UI components
- `src/engine` - pure TypeScript pattern model and generators
- `src/audio` - Web Audio preview engine
- `src/midi` - MIDI service, mapping, and MIDI file conversion boundaries
- `src/storage` - local JSON persistence helpers
- `src/tests` - core engine and persistence tests
- `src-tauri` - Tauri desktop shell scaffold

## Hardware Notes

Direct Electribe 2 control is intentionally deferred. MIDI channel and part mapping live behind configurable service interfaces so real-device research can happen without rewriting the generator.
