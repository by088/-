import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
import { Value } from '../../domain/Value.js';

export class DeleteCommand extends EditCommand {
  private readonly id: string;
  constructor(args: readonly string[]) { super(); Value.count(args,1,1,'delete <id>'); this.id = args[0]!; }
  protected override apply(document: SvgDocument): string { const shape = document.delete(this.id); return `${shape.label} deleted`; }
}
