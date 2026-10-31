import { Command } from '../Command.js';
import type { Session } from '../Session.js';
import { Value } from '../../domain/Value.js';

export class RedoCommand extends Command {
  constructor(args: readonly string[]) { super(); Value.count(args,0,0,'redo'); }
  override async execute(session: Session): Promise<string[]> {
    void session.document; return session.history.redo(session);
  }
}
