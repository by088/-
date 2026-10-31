import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
import { Value } from '../../domain/Value.js';

export class UngroupCommand extends EditCommand {
  private readonly id: string;
  constructor(args: readonly string[]) { super(); Value.count(args,1,1,'ungroup <id>'); this.id = args[0]!; }
  protected override apply(document: SvgDocument): string { document.ungroup(this.id); return `g#${this.id} ungrouped`; }
}
