import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
import { Value } from '../../domain/Value.js';

export class AddToCommand extends EditCommand {
  constructor(private readonly args: readonly string[]) { super(); Value.count(args,2,2,'addto <gid> <id>'); }
  protected override apply(document: SvgDocument): string {
    const shape = document.find(this.args[1]!); document.addTo(this.args[0]!,shape.id);
    return `${shape.label} added to ${document.container(this.args[0]!).label}`;
  }
}
