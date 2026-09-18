# Electribe 2 MIDI Research

Direct Electribe 2 control is not implemented in Phase 1.

## Product Goal

GHOST should remain a step-pattern tool first. The desktop and MIDI layers must preserve the step sequencer workflow instead of flattening patterns into generic piano-roll data.

The long-term Electribe path should use as much of the hardware as we can safely verify:

- 16-part style pattern workflows
- Per-part MIDI channels and note mappings
- Step length, note duration, velocity, and gate behavior
- Muting, soloing, and performance-level volume changes
- Groove, swing, and clock sync
- CC or NRPN parameter control where the Electribe documents it
- Motion-sequence style automation if it can be represented safely
- Pattern import/export flows that keep hardware structure intact

Generic MIDI support is only the foundation. Korg-specific mappings should be added behind the existing MIDI service and mapper boundaries once they are tested against the device.

Current generic MIDI support:

- Each GHOST track has an editable MIDI channel in the Mapping panel.
- MIDI file export uses the track channel values.
- Web MIDI output sends note events using the same track channel values.
- Track names and channels are saved in the pattern JSON.

Before adding `sendToElectribe()`, verify against hardware:

- MIDI channel defaults for each part
- Note mapping for drum and synth parts
- CC and NRPN mappings for parameters
- Pattern write behavior over MIDI, if exposed
- Clock sync behavior and transport expectations
- SysEx availability and safety

Keep findings here and reflect them in `src/midi/MidiMapper.ts`.
