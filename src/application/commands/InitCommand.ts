import { Command } from '../Command.js';
import type { Session } from '../Session.js';
import { SvgDocument } from '../../domain/SvgDocument.js';
import { Value } from '../../domain/Value.js';

export class InitCommand extends Command {
  constructor(private readonly args: readonly string[]) { super(); Value.count(args,0,2,'init [w] [h]'); }
  override async execute(session: Session): Promise<string[]> {
    const doc = new SvgDocument(Value.positive(this.args[0] ?? '800','width'),Value.positive(this.args[1] ?? '600','height'));
    session.commitIO(doc,undefined); return [`canvas ${doc.width}x${doc.height} created`];
  }
}
