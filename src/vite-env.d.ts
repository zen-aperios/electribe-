/// <reference types="vite/client" />

interface Navigator {
  requestMIDIAccess?: () => Promise<MIDIAccess>;
}

interface MIDIAccess {
  inputs: Map<string, MIDIInput>;
  outputs: Map<string, MIDIOutput>;
}

interface MIDIPort {
  id: string;
  name?: string;
}

interface MIDIInput extends MIDIPort {
  onmidimessage: ((event: MIDIMessageEvent) => void) | null;
}

interface MIDIMessageEvent {
  timeStamp: number;
  data: Uint8Array;
}

interface MIDIOutput extends MIDIPort {
  send(data: number[], timestamp?: number): void;
}
