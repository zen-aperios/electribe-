import type { Pattern } from "../engine/Pattern";

export type StepCallback = (step: number) => void;
export type ScheduleCallback = (step: number, audioTime: number) => void;

export interface SequencerOptions {
  lookaheadMs: number;
  scheduleAheadSeconds: number;
}

const DEFAULT_OPTIONS: SequencerOptions = {
  lookaheadMs: 25,
  scheduleAheadSeconds: 0.12,
};

export class Sequencer {
  private timer: number | undefined;
  private nextStep = 0;
  private nextStepTime = 0;
  private options: SequencerOptions;

  constructor(options: Partial<SequencerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  start(
    pattern: Pattern,
    getCurrentTime: () => number,
    onStep: StepCallback,
    onSchedule: ScheduleCallback,
  ): void {
    this.stop();
    this.nextStep = 0;
    this.nextStepTime = getCurrentTime() + 0.06;

    const schedule = () => {
      const currentTime = getCurrentTime();
      while (this.nextStepTime < currentTime + this.options.scheduleAheadSeconds) {
        const step = this.nextStep;
        const scheduledTime = this.nextStepTime;
        onSchedule(step, scheduledTime);
        window.setTimeout(
          () => onStep(step),
          Math.max(0, (scheduledTime - currentTime) * 1000),
        );
        this.advance(pattern);
      }

      this.timer = window.setTimeout(schedule, this.options.lookaheadMs);
    };

    schedule();
  }

  stop(): void {
    if (this.timer !== undefined) {
      window.clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  private advance(pattern: Pattern): void {
    this.nextStep = (this.nextStep + 1) % pattern.length;
    this.nextStepTime += stepDurationSeconds(pattern.bpm);
  }
}

export function stepDurationSeconds(bpm: number): number {
  return (60 / bpm) / 4;
}
