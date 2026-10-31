import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
import { ShapeFactory } from '../../domain/ShapeFactory.js';
import { Value } from '../../domain/Value.js';

export class CreateCommand extends EditCommand {
  private readonly params: string[];
  private readonly parent: string | undefined;
  private readonly type: string;
  private readonly id: string;
  constructor(args: readonly string[], private readonly factory: ShapeFactory) {
    super(); const parts = [...args];
    if (parts.length >= 4 && parts.at(-2) === 'in') { this.parent = parts.pop()!; parts.pop(); }
    Value.count(parts, 2, Infinity, 'create <type> <id> [params…] [in <containerId>]');
    this.type = parts[0]!; this.id = parts[1]!; this.params = parts.slice(2);
  }
  protected override apply(document: SvgDocument): string {
    const shape = this.factory.create(this.type, this.id, this.params);
    document.add(shape, this.parent);
    return `${shape.label} created${this.parent === undefined ? '' : ` in ${document.container(this.parent).label}`}`;
  }
}
