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

type MIDIInput = MIDIPort;

interface MIDIOutput extends MIDIPort {
  send(data: number[], timestamp?: number): void;
}
