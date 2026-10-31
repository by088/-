import assert from 'node:assert/strict';
import { Session } from '../src/application/Session.js';
import { CommandProcessor } from '../src/cli/CommandProcessor.js';
import { FileSvgStore } from '../src/infrastructure/FileSvgStore.js';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';

export class TestRig {
  readonly session = new Session(new FileSvgStore());
  readonly cli = new CommandProcessor(this.session);
  async run(...lines: string[]): Promise<string[]> {
    let output: string[] = [];
    for (const line of lines) {
      output = await this.cli.execute(line);
      assert.ok(!output.some(item => item.startsWith('error:')), `${line}: ${output.join('\n')}`);
    }
    return output;
  }
  async error(line: string, expected: string | RegExp): Promise<void> {
    const output = await this.cli.execute(line);
    assert.equal(output.length,1);
    if (typeof expected === 'string') assert.equal(output[0],`error: ${expected}`);
    else assert.match(output[0]!,expected);
  }
  snapshot(): string { return new SvgCodec().encode(this.session.document); }
  attrs(id: string): Readonly<Record<string,string>> { return this.session.document.find(id).attributes(); }
}
