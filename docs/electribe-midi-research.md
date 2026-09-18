# Electribe 2 MIDI Research

Direct Electribe 2 control is not implemented in Phase 1.

## Product Goal

GHOST should remain a step-pattern tool first. The desktop and MIDI layers must preserve the step sequencer workflow instead of flattening patterns into generic piano-roll data.

The long-term Electribe path should use as much of the hardware as we can safely verify:

- 16-part style pattern workflows
- Clear display of which GHOST track maps to which Electribe part or instrument role
- Editable instrument names for the target sound assigned to each part
- Per-part MIDI channels and note mappings
- Step length, note duration, velocity, and gate behavior
- Muting, soloing, and performance-level volume changes
- Groove, swing, and clock sync
- CC or NRPN parameter control where the Electribe documents it
- Motion-sequence style automation if it can be represented safely
- Pattern import/export flows that keep hardware structure intact

Generic MIDI support is only the foundation. Korg-specific mappings should be added behind the existing MIDI service and mapper boundaries once they are tested against the device.

## Mirror Mode Goal

GHOST should eventually offer a hardware mirror mode for the connected Electribe. In that mode, the app should show hardware-facing state rather than only the local GHOST pattern:

- Connected device name and selected MIDI output/input
- Active mapped part or instrument track
- Incoming channel activity highlights the matching mapped part in the interface
- Current play step when MIDI clock or transport data is available
- Muted or active parts when the hardware exposes that state
- Pattern length, tempo, and swing alignment
- Incoming notes or controller changes that can be observed over MIDI

Mirror mode depends on real MIDI input and verified Electribe behavior. If the Electribe does not expose a state over MIDI or SysEx, GHOST should label that state as local/unverified instead of pretending it is mirrored.

Current generic MIDI support:

- Each GHOST track has an editable MIDI channel in the Mapping panel.
- Each GHOST track has an editable Electribe instrument label for the target part sound.
- MIDI input mirror mode highlights the mapped part when channel voice data arrives.
- MIDI file export uses the track channel values.
- Web MIDI output sends note events using the same track channel values.
- Track names, instrument labels, and channels are saved in the pattern JSON.

Before adding `sendToElectribe()`, verify against hardware:

- MIDI channel defaults for each part
- SysEx pattern fields that reveal oscillator/instrument assignment names or IDs
- Note mapping for drum and synth parts
- CC and NRPN mappings for parameters
- Pattern write behavior over MIDI, if exposed
- Clock sync behavior and transport expectations
- SysEx availability and safety

Keep findings here and reflect them in `src/midi/MidiMapper.ts`.
