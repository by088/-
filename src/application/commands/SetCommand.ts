import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
import { Value } from '../../domain/Value.js';

export class SetCommand extends EditCommand {
  constructor(private readonly args: readonly string[]) { super(); Value.count(args,3,3,'set <id> <attr> <value>'); }
  protected override apply(document: SvgDocument): string {
    const shape = document.find(this.args[0]!); shape.set(this.args[1]!,this.args[2]!);
    return `${shape.label} updated: ${this.args[1]}=${JSON.stringify(this.args[2])}`;
  }
}
