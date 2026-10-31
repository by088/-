import type { UndoableCommand } from './UndoableCommand.js';
import type { Session } from './Session.js';
import { EditorError } from '../domain/EditorError.js';

export class History {
  private past: UndoableCommand[] = [];
  private future: UndoableCommand[] = [];
  private blocked = true;
  barrier(): void { this.past = []; this.future = []; this.blocked = true; }
  record(command: UndoableCommand): void { this.past.push(command); this.future = []; this.blocked = false; }
  undo(session: Session): string[] {
    if (this.blocked) throw new EditorError('undo not allowed after io command');
    const command = this.past.at(-1);
    if (!command) throw new EditorError('nothing to undo');
    const result = command.undo(session); this.past.pop(); this.future.push(command); return result;
  }
  redo(session: Session): string[] {
    if (this.blocked) throw new EditorError('undo not allowed after io command');
    const command = this.future.at(-1);
    if (!command) throw new EditorError('nothing to redo');
    const result = command.redo(session); this.future.pop(); this.past.push(command); return result;
  }
}
