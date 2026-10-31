import { Command } from '../Command.js';
import type { Session } from '../Session.js';
import { Value } from '../../domain/Value.js';

export class CanvasCommand extends Command {
  constructor(private readonly args: readonly string[]) { super(); if (args.length) Value.count(args,2,2,'canvas [w h]'); }
  override async execute(session: Session): Promise<string[]> {
    let doc = session.document;
    if (this.args.length) {
      doc = doc.clone(); doc.resize(Value.positive(this.args[0]!,'width'), Value.positive(this.args[1]!,'height'));
      session.commitIO(doc,session.path);
    }
    return [`canvas ${doc.width}x${doc.height}`];
  }
}
