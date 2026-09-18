import { Pause, Play } from "lucide-react";

interface TransportProps {
  isPlaying: boolean;
  bpm: number;
  swing: number;
  onTogglePlay(): void;
}

export function Transport({ isPlaying, bpm, swing, onTogglePlay }: TransportProps) {
  return (
    <section className="transport">
      <button onClick={onTogglePlay} title={isPlaying ? "Stop" : "Play"}>
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
      </button>
      <span>{bpm} BPM</span>
      <span>{swing}% Swing</span>
      <span>Space</span>
    </section>
  );
}
