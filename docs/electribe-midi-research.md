# Electribe 2 MIDI Research

Direct Electribe 2 control is not implemented in Phase 1.

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
