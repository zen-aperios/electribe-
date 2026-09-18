import { useEffect, useMemo, useRef } from "react";
import type { Pattern } from "../engine/Pattern";

const TRACK_COLORS = [
  "#ff365c",
  "#ff7a36",
  "#ffd447",
  "#58f59b",
  "#35d0ff",
  "#4c86ff",
  "#b56cff",
  "#ff6fd8",
];

interface PatternArrangementViewProps {
  pattern: Pattern;
  currentStep: number;
}

export function PatternArrangementView({
  pattern,
  currentStep,
}: PatternArrangementViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const patternRef = useRef(pattern);
  const stepRef = useRef(currentStep);

  patternRef.current = pattern;
  stepRef.current = currentStep;

  const trackLabels = useMemo(
    () => pattern.tracks.map((track, index) => `P${index + 1} ${track.name}`),
    [pattern.tracks],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let animationFrame = 0;
    const render = () => {
      drawArrangement(canvas, patternRef.current, stepRef.current);
      animationFrame = window.requestAnimationFrame(render);
    };

    render();
    return () => window.cancelAnimationFrame(animationFrame);
  }, [pattern]);

  return (
    <section className="arrangement-panel" aria-label="Pattern arrangement graph">
      <div
        className="arrangement-labels"
        style={{ gridTemplateRows: `repeat(${trackLabels.length}, minmax(0, 1fr))` }}
        aria-hidden="true"
      >
        {trackLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <canvas ref={canvasRef} />
    </section>
  );
}

function drawArrangement(
  canvas: HTMLCanvasElement,
  pattern: Pattern,
  currentStep: number,
): void {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(window.devicePixelRatio, 2);
  const width = Math.max(1, Math.floor(rect.width * scale));
  const height = Math.max(1, Math.floor(rect.height * scale));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.clearRect(0, 0, rect.width, rect.height);

  if (pattern.tracks.length === 0 || pattern.length === 0) {
    return;
  }

  const padding = 10;
  const graphWidth = rect.width - padding * 2;
  const graphHeight = rect.height - padding * 2;
  const laneHeight = graphHeight / pattern.tracks.length;
  const stepWidth = graphWidth / pattern.length;

  const gradient = context.createLinearGradient(0, 0, 0, rect.height);
  gradient.addColorStop(0, "#0d1110");
  gradient.addColorStop(1, "#070908");
  context.fillStyle = gradient;
  context.fillRect(0, 0, rect.width, rect.height);

  for (let step = 0; step <= pattern.length; step += 1) {
    context.fillStyle = step % 4 === 0 ? "#39423c" : "#202622";
    context.fillRect(
      padding + step * stepWidth,
      padding,
      step % 4 === 0 ? 2 : 1,
      graphHeight,
    );
  }

  pattern.tracks.forEach((track, trackIndex) => {
    const y = padding + trackIndex * laneHeight;
    const color = TRACK_COLORS[trackIndex % TRACK_COLORS.length];

    context.fillStyle = trackIndex % 2 === 0 ? "#111613" : "#0d120f";
    context.fillRect(padding, y + laneHeight * 0.08, graphWidth, laneHeight * 0.84);

    track.notes.forEach((note) => {
      const noteX = padding + note.step * stepWidth;
      const noteWidth = Math.max(3, stepWidth * Math.max(1, note.duration) * 0.86);
      const noteHeight = laneHeight * (0.2 + note.velocity * 0.62);
      const noteY = y + (laneHeight - noteHeight) / 2;

      context.globalAlpha = track.muted ? 0.3 : 0.96;
      context.fillStyle = color;
      roundedRect(context, noteX, noteY, noteWidth, noteHeight, 3);
      context.fill();

      context.globalAlpha = track.muted ? 0.16 : 0.42;
      context.fillStyle = "#ffffff";
      const waveformSlices = Math.max(2, Math.floor(noteWidth / 8));
      for (let slice = 0; slice < waveformSlices; slice += 1) {
        const sliceX = noteX + (slice / waveformSlices) * noteWidth;
        const amplitude = Math.sin((slice + note.pitch) * 1.7) * 0.5 + 0.5;
        const sliceHeight = noteHeight * (0.18 + amplitude * 0.42);
        context.fillRect(
          sliceX,
          noteY + (noteHeight - sliceHeight) / 2,
          Math.max(1, noteWidth / waveformSlices - 2),
          sliceHeight,
        );
      }
      context.globalAlpha = 1;
    });
  });

  const playheadX = padding + (currentStep + 0.5) * stepWidth;
  context.fillStyle = "#f1f4ed";
  context.fillRect(playheadX - 1, padding, 2, graphHeight);
  context.fillStyle = "#ff6b35";
  context.fillRect(playheadX - 3, padding - 3, 6, 5);
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}
