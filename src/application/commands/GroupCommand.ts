import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
import { Value } from '../../domain/Value.js';

export class GroupCommand extends EditCommand {
  constructor(private readonly args: readonly string[]) { super(); Value.count(args,2,Infinity,'group <newGid> <id1> <id2>…'); }
  protected override apply(document: SvgDocument): string {
    const group = document.group(this.args[0]!, this.args.slice(1)); return `${group.label} created with ${group.children.length} children`;
  }
}
