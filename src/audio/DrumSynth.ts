export function playKick(
  context: AudioContext,
  destination: AudioNode,
  startTime: number,
  velocity: number,
): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(120, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(42, startTime + 0.12);
  gain.gain.setValueAtTime(velocity * 0.75, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.22);

  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + 0.24);
}

export function playSnare(
  context: AudioContext,
  destination: AudioNode,
  startTime: number,
  velocity: number,
): void {
  const noise = context.createBufferSource();
  const buffer = context.createBuffer(1, context.sampleRate * 0.18, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }

  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  filter.type = "bandpass";
  filter.frequency.value = 1800;
  gain.gain.setValueAtTime(velocity * 0.35, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);

  noise.buffer = buffer;
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  noise.start(startTime);
  noise.stop(startTime + 0.2);
}

export function playHat(
  context: AudioContext,
  destination: AudioNode,
  startTime: number,
  velocity: number,
): void {
  const noise = context.createBufferSource();
  const buffer = context.createBuffer(1, context.sampleRate * 0.08, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }

  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  filter.type = "highpass";
  filter.frequency.value = 7000;
  gain.gain.setValueAtTime(velocity * 0.18, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.06);

  noise.buffer = buffer;
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  noise.start(startTime);
  noise.stop(startTime + 0.08);
}
