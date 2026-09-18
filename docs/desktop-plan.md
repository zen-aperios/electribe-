# Desktop Plan

GHOST remains local-first. The web app stays the primary UI shell, and desktop support should add native MIDI/device access without changing generation, pattern editing, import/export, or library behavior.

## Target Order

1. macOS desktop development build
2. macOS native MIDI send/receive
3. Windows and Linux packaging smoke checks
4. Windows and Linux native MIDI validation

## Runtime Boundary

The UI must talk to the `MidiService` interface only. Browser builds use `WebMidiService`; desktop builds detect Tauri and route through `TauriMidiService`.

`TauriMidiService` is intentionally a placeholder until the Tauri backend command layer exists. It should fail loudly with a clear status message instead of silently pretending native MIDI is available.

## Native MIDI Shape

The Tauri backend should expose commands for:

- Listing MIDI inputs and outputs
- Connecting to an output by id
- Sending note on/off messages
- Sending CC messages
- Sending MIDI clock
- Sending a scheduled pattern

The frontend should continue to serialize pattern intent through the existing `MidiService` methods. Any device-specific Korg Electribe behavior should live behind that interface.

## Packaging

Keep packaging boring at first:

- Use the existing Vite build as the frontend artifact
- Keep Tauri config minimal
- Avoid code signing until the app can send real MIDI reliably
- Add platform-specific packaging notes only after the first working macOS build
