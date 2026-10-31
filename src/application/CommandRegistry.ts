import { InitCommand } from './commands/InitCommand.js';
import { ReadCommand } from './commands/ReadCommand.js';
import { SaveCommand } from './commands/SaveCommand.js';
import { CanvasCommand } from './commands/CanvasCommand.js';
import { CreateCommand } from './commands/CreateCommand.js';
import { DeleteCommand } from './commands/DeleteCommand.js';
import { MoveCommand } from './commands/MoveCommand.js';
import { ScaleCommand } from './commands/ScaleCommand.js';
import { SetCommand } from './commands/SetCommand.js';
import { GroupCommand } from './commands/GroupCommand.js';
import { UngroupCommand } from './commands/UngroupCommand.js';
import { AddToCommand } from './commands/AddToCommand.js';
import { FrontCommand } from './commands/FrontCommand.js';
import { BackCommand } from './commands/BackCommand.js';
import { TreeCommand } from './commands/TreeCommand.js';
import { ShowCommand } from './commands/ShowCommand.js';
import { HelpCommand } from './commands/HelpCommand.js';
import { UndoCommand } from './commands/UndoCommand.js';
import { RedoCommand } from './commands/RedoCommand.js';
import type { Command } from './Command.js';
import { ShapeFactory } from '../domain/ShapeFactory.js';
import { EditorError } from '../domain/EditorError.js';

export class CommandRegistry {
  // Name dispatch point 2/2; extensible registration is deferred to Phase 2.
  private readonly builders: Map<string, (args: readonly string[]) => Command>;
  constructor(factory = new ShapeFactory()) {
    this.builders = new Map([
      ['init', args => new InitCommand(args)],
      ['read', args => new ReadCommand(args)],
      ['save', args => new SaveCommand(args)],
      ['canvas', args => new CanvasCommand(args)],
      ['create', args => new CreateCommand(args,factory)],
      ['delete', args => new DeleteCommand(args)],
      ['move', args => new MoveCommand(args)],
      ['scale', args => new ScaleCommand(args)],
      ['set', args => new SetCommand(args)],
      ['group', args => new GroupCommand(args)],
      ['ungroup', args => new UngroupCommand(args)],
      ['addto', args => new AddToCommand(args)],
      ['front', args => new FrontCommand(args)],
      ['back', args => new BackCommand(args)],
      ['tree', args => new TreeCommand(args)],
      ['show', args => new ShowCommand(args)],
      ['help', args => new HelpCommand(args)],
      ['undo', args => new UndoCommand(args)],
      ['redo', args => new RedoCommand(args)]
    ]);
  }
  create(name: string, args: readonly string[]): Command {
    const builder = this.builders.get(name);
    if (!builder) throw new EditorError(`unknown command: ${name}`);
    return builder(args);
  }
}
