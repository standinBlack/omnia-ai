import { isStubMode } from "./config";

export interface LLMAdapter {
  generateScript(topic: string, targetSeconds: number): Promise<{ scenes: { text: string }[] }>;
}

export interface TTSAdapter {
  synthesize(text: string, voice: string): Promise<Buffer>;
}

class StubLLM implements LLMAdapter {
  async generateScript(topic: string) {
    return {
      scenes: [
        { text: `Introduction to ${topic.slice(0, 60)}` },
        { text: "Main idea explained with a simple example." },
        { text: "Summary and call to action." },
      ],
    };
  }
}

class StubTTS implements TTSAdapter {
  async synthesize() {
    // Minimal silent WAV header (44 bytes) + short silence
    const header = Buffer.alloc(44);
    header.write("RIFF", 0);
    header.writeUInt32LE(36, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(1, 22);
    header.writeUInt32LE(8000, 24);
    header.writeUInt32LE(8000, 28);
    header.writeUInt16LE(1, 32);
    header.writeUInt16LE(8, 34);
    header.write("data", 36);
    header.writeUInt32LE(0, 40);
    return header;
  }
}

export function getLLM(): LLMAdapter {
  if (isStubMode()) return new StubLLM();
  // Real provider would go here based on LLM_PROVIDER
  return new StubLLM();
}

export function getTTS(): TTSAdapter {
  if (isStubMode()) return new StubTTS();
  return new StubTTS();
}
