# Electribe 2 MIDI Research

Direct Electribe 2 control is not implemented in Phase 1.

Before adding `sendToElectribe()`, verify against hardware:

- MIDI channel defaults for each part
- Note mapping for drum and synth parts
- CC and NRPN mappings for parameters
- Pattern write behavior over MIDI, if exposed
- Clock sync behavior and transport expectations
- SysEx availability and safety

Keep findings here and reflect them in `src/midi/MidiMapper.ts`.
