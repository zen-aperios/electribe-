import { audibleTracks, type Pattern } from "../engine/Pattern";
import { playHat, playKick, playSnare } from "./DrumSynth";
import { midiToFrequency, playTone } from "./Synth";

export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private previewTimeouts: number[] = [];

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

  get currentTime(): number {
    return this.context?.currentTime ?? 0;
  }

  playStep(pattern: Pattern, step: number): void {
    this.playStepAt(pattern, step, this.currentTime + 0.015);
  }

  playStepAt(pattern: Pattern, step: number, startTime: number): void {
    if (!this.context || !this.master) {
      return;
    }

    const secondsPerStep = (60 / pattern.bpm) / 4;

    audibleTracks(pattern).forEach((track) => {
      track.notes
        .filter((note) => note.step === step && Math.random() <= note.probability)
        .forEach((note) => {
          const time = startTime + (note.microTiming ?? 0) * secondsPerStep;
          const velocity = note.velocity * track.volume;
          if (track.instrumentType === "kick") {
            playKick(this.context!, this.master!, time, velocity);
          } else if (track.instrumentType === "snare") {
            playSnare(this.context!, this.master!, time, velocity);
          } else if (track.instrumentType === "hat") {
            playHat(this.context!, this.master!, time, velocity);
          } else {
            playTone(
              this.context!,
              this.master!,
              midiToFrequency(note.pitch),
              time,
              secondsPerStep * note.duration,
              velocity,
            );
          }
        });
    });
  }

  previewPattern(
    pattern: Pattern,
    onStep?: (step: number) => void,
    steps = Math.min(16, pattern.length),
  ): void {
    if (!this.context || !this.master) {
      return;
    }

    this.stopPreview();
    const stepDurationMs = (60_000 / pattern.bpm) / 4;
    Array.from({ length: steps }, (_, index) => index).forEach((step) => {
      const timeout = window.setTimeout(() => {
        onStep?.(step);
        this.playStep(pattern, step % pattern.length);
      }, step * stepDurationMs);
      this.previewTimeouts.push(timeout);
    });
  }

  stopPreview(): void {
    this.previewTimeouts.forEach((timeout) => window.clearTimeout(timeout));
    this.previewTimeouts = [];
  }
}
