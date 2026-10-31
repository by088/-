import { Command } from '../Command.js';
import type { Session } from '../Session.js';
import { Value } from '../../domain/Value.js';

export class ReadCommand extends Command {
  constructor(private readonly args: readonly string[]) { super(); Value.count(args,1,1,'read <file.svg>'); }
  override async execute(session: Session): Promise<string[]> {
    const path = this.args[0]!; const result = await session.store.read(path);
    session.commitIO(result.document,path); return [...result.warnings, `read ${path} (${result.document.count} elements)`];
  }
}
