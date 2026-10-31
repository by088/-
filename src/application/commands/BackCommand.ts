import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
import { Value } from '../../domain/Value.js';

export class BackCommand extends EditCommand {
  private readonly id: string;
  constructor(args: readonly string[]) { super(); Value.count(args,1,1,'back <id>'); this.id = args[0]!; }
  protected override apply(document: SvgDocument): string { document.reorder(this.id,false); return `${document.find(this.id).label} moved to back`; }
}
