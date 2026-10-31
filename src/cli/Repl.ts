import { createInterface } from 'node:readline';
import type { Readable, Writable } from 'node:stream';
import type { CommandProcessor } from './CommandProcessor.js';

export class Repl {
  constructor(private readonly processor: CommandProcessor) {}
  async run(input: Readable, output: Writable, interactive = false): Promise<boolean> {
    const reader = createInterface({input, crlfDelay: Infinity, terminal: false});
    let ok = true;
    if (interactive) output.write("svg-editor 0.1 — type 'help' for commands\n\nsvg> ");
    for await (const line of reader) {
      const result = await this.processor.execute(line);
      for (const message of result) output.write(message + '\n');
      if (result.some(message => message.startsWith('error:'))) ok = false;
      if (interactive) output.write('svg> ');
    }
    return ok;
  }
}
