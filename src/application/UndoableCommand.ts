import type { Session } from './Session.js';
export interface UndoableCommand {
  undo(session: Session): string[];
  redo(session: Session): string[];
}
