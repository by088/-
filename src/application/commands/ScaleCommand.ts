import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
import { Value } from '../../domain/Value.js';

export class ScaleCommand extends EditCommand {
  constructor(private readonly args: readonly string[]) { super(); Value.count(args,2,2,'scale <id> <factor>'); }
  protected override apply(document: SvgDocument): string {
    const factor = Value.positive(this.args[1]!, 'scale factor'); const shape = document.find(this.args[0]!);
    shape.scale(factor); return `${shape.label} scaled by ${factor}`;
  }
}
