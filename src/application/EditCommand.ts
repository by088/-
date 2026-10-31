import { Command } from './Command.js';
import type { Session } from './Session.js';
import type { UndoableCommand } from './UndoableCommand.js';
import type { SvgDocument } from '../domain/SvgDocument.js';

export abstract class EditCommand extends Command implements UndoableCommand {
  private before!: SvgDocument;
  private after!: SvgDocument;
  private result = '';
  protected abstract apply(document: SvgDocument): string;
  override async execute(session: Session): Promise<string[]> {
    const before = session.document.clone();
    const draft = before.clone();
    const result = this.apply(draft);
    // Nothing observable is mutated until validation and the whole edit succeed.
    this.before = before; this.after = draft.clone(); this.result = result;
    session.replace(draft); session.history.record(this); return [result];
  }
  undo(session: Session): string[] { session.replace(this.before.clone()); return [`undone: ${this.result}`]; }
  redo(session: Session): string[] { session.replace(this.after.clone()); return [`redone: ${this.result}`]; }
}
