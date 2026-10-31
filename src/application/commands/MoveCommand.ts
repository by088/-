import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
import { Value } from '../../domain/Value.js';

export class MoveCommand extends EditCommand {
  constructor(private readonly args: readonly string[]) { super(); Value.count(args,3,3,'move <id> <dx> <dy>'); }
  protected override apply(document: SvgDocument): string {
    const shape = document.find(this.args[0]!); const dx = Value.number(this.args[1]!, 'dx'); const dy = Value.number(this.args[2]!, 'dy');
    shape.move(dx,dy); return `${shape.label} moved ${shape.locationText ? `to ${shape.locationText}` : `by (${dx},${dy})`}`;
  }
}
