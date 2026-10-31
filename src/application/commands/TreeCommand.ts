import { Command } from '../Command.js';
import type { Session } from '../Session.js';
import { TreeFormatter } from '../TreeFormatter.js';
import { Value } from '../../domain/Value.js';

export class TreeCommand extends Command {
  constructor(private readonly args: readonly string[]) { super(); Value.count(args,0,1,'tree [id]'); }
  override async execute(session: Session): Promise<string[]> { return new TreeFormatter().tree(session.document,this.args[0]); }
}
