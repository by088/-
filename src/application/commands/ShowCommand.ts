import { Command } from '../Command.js';
import type { Session } from '../Session.js';
import { TreeFormatter } from '../TreeFormatter.js';
import { Value } from '../../domain/Value.js';

export class ShowCommand extends Command {
  constructor(private readonly args: readonly string[]) { super(); Value.count(args,1,1,'show <id>'); }
  override async execute(session: Session): Promise<string[]> { return new TreeFormatter().show(session.document,this.args[0]!); }
}
