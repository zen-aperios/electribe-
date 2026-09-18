import type { Pattern } from "../engine/Pattern";

export type StepCallback = (step: number) => void;

export class Sequencer {
  private timer: number | undefined;
  private step = 0;

  start(pattern: Pattern, onStep: StepCallback, onTick: (step: number, time: number) => void): void {
    this.stop();
    this.step = 0;
    const tick = () => {
      const stepDurationMs = (60_000 / pattern.bpm) / 4;
      onStep(this.step);
      onTick(this.step, performance.now());
      this.step = (this.step + 1) % pattern.length;
      this.timer = window.setTimeout(tick, stepDurationMs);
    };
    tick();
  }

  stop(): void {
    if (this.timer !== undefined) {
      window.clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}
