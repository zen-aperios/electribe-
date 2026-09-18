import type { Pattern } from "../engine/Pattern";
import { playHat, playKick, playSnare } from "./DrumSynth";
import { midiToFrequency, playTone } from "./Synth";

export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;

  async ensureReady(): Promise<void> {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(this.context.destination);
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  playStep(pattern: Pattern, step: number): void {
    if (!this.context || !this.master) {
      return;
    }

    const secondsPerStep = (60 / pattern.bpm) / 4;
    const startTime = this.context.currentTime + 0.015;

    pattern.tracks.forEach((track) => {
      track.notes
        .filter((note) => note.step === step && Math.random() <= note.probability)
        .forEach((note) => {
          const time = startTime + (note.microTiming ?? 0) * secondsPerStep;
          if (track.instrumentType === "kick") {
            playKick(this.context!, this.master!, time, note.velocity);
          } else if (track.instrumentType === "snare") {
            playSnare(this.context!, this.master!, time, note.velocity);
          } else if (track.instrumentType === "hat") {
            playHat(this.context!, this.master!, time, note.velocity);
          } else {
            playTone(
              this.context!,
              this.master!,
              midiToFrequency(note.pitch),
              time,
              secondsPerStep * note.duration,
              note.velocity,
            );
          }
        });
    });
  }
}
