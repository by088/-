import { Command } from '../Command.js';
import type { Session } from '../Session.js';
import { Value } from '../../domain/Value.js';
import { EditorError } from '../../domain/EditorError.js';

export class SaveCommand extends Command {
  constructor(private readonly args: readonly string[]) { super(); Value.count(args,0,1,'save [file.svg]'); }
  override async execute(session: Session): Promise<string[]> {
    const doc = session.document; const path = this.args[0] ?? session.path;
    if (!path) throw new EditorError('no file path. use save <file.svg>');
    await session.store.write(path,doc); session.commitIO(doc,path);
    return [`saved to ${path} (${doc.count} elements)`];
  }
}
