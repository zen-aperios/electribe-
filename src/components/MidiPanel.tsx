import { Cable } from "lucide-react";

export function MidiPanel() {
  return (
    <section className="midi-panel">
      <h2>
        <Cable size={16} />
        MIDI
      </h2>
      <p>Web MIDI output is scaffolded. Direct Electribe mapping needs hardware verification.</p>
    </section>
  );
}
