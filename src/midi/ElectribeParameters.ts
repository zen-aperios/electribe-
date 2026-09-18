export const ELECTRIBE_PARAMETERS = [
  { id: "level", label: "Level", cc: 7, defaultValue: 100 },
  { id: "pan", label: "Pan", cc: 10, defaultValue: 64 },
  { id: "resonance", label: "Reso", cc: 71, defaultValue: 0 },
  { id: "egRelease", label: "EG Rel", cc: 72, defaultValue: 64 },
  { id: "egAttack", label: "Attack", cc: 73, defaultValue: 0 },
  { id: "cutoff", label: "Cutoff", cc: 74, defaultValue: 100 },
  { id: "oscPitch", label: "Osc Pitch", cc: 80, defaultValue: 64 },
  { id: "oscGlide", label: "Glide", cc: 81, defaultValue: 0 },
  { id: "oscEdit", label: "Osc Edit", cc: 82, defaultValue: 64 },
  { id: "filterEg", label: "Filt EG", cc: 83, defaultValue: 64 },
  { id: "modDepth", label: "Mod Depth", cc: 85, defaultValue: 0 },
  { id: "modSpeed", label: "Mod Speed", cc: 86, defaultValue: 64 },
  { id: "insertFxEdit", label: "IFX Edit", cc: 87, defaultValue: 64 },
  { id: "touchX", label: "Pad X", cc: 102, defaultValue: 64 },
  { id: "touchY", label: "Pad Y", cc: 103, defaultValue: 64 },
  { id: "ifxOn", label: "IFX", cc: 104, defaultValue: 0 },
  { id: "mfxSend", label: "MFX Send", cc: 105, defaultValue: 0 },
  { id: "touchOn", label: "Pad On", cc: 106, defaultValue: 0 },
] as const;

export type ElectribeParameterId = (typeof ELECTRIBE_PARAMETERS)[number]["id"];

export type ElectribeParameterValues = Record<ElectribeParameterId, number>;

export interface MidiControlEvent {
  channel: number;
  controller: number;
  value: number;
}

export const DEFAULT_ELECTRIBE_PARAMETERS = ELECTRIBE_PARAMETERS.reduce(
  (values, parameter) => ({
    ...values,
    [parameter.id]: parameter.defaultValue,
  }),
  {} as ElectribeParameterValues,
);

export function normalizeElectribeParameters(
  values: Partial<Record<ElectribeParameterId, number>> = {},
): ElectribeParameterValues {
  return ELECTRIBE_PARAMETERS.reduce(
    (normalized, parameter) => ({
      ...normalized,
      [parameter.id]: clampMidiValue(values[parameter.id] ?? parameter.defaultValue),
    }),
    {} as ElectribeParameterValues,
  );
}

export function electribeParametersToMidiControlEvents(
  midiChannel: number,
  values: Partial<Record<ElectribeParameterId, number>> = {},
): MidiControlEvent[] {
  const normalized = normalizeElectribeParameters(values);

  return ELECTRIBE_PARAMETERS.map((parameter) => ({
    channel: Math.round(clamp(midiChannel, 1, 16)),
    controller: parameter.cc,
    value: normalized[parameter.id],
  }));
}

export function electribeParameterIdForCc(
  controller: number,
): ElectribeParameterId | null {
  return (
    ELECTRIBE_PARAMETERS.find((parameter) => parameter.cc === controller)?.id ?? null
  );
}

function clampMidiValue(value: number): number {
  return Math.round(clamp(value, 0, 127));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
