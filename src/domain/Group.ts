import { Shape } from './Shape.js';
import { Value } from './Value.js';
import { EditorError } from './EditorError.js';

export class Group extends Shape {
  private readonly nodes: Shape[] = [];
  constructor(id: string) { super('g', id); }
  override get children(): readonly Shape[] { return [...this.nodes]; }
  contains(shape: Shape): boolean { return this === shape || this.nodes.some(child => child === shape || (child instanceof Group && child.contains(shape))); }
  insert(shape: Shape, index = this.nodes.length): void {
    if (shape === this || (shape instanceof Group && shape.contains(this))) throw new EditorError(`cannot group a container into its own descendant: ${shape.id}`);
    if (this.nodes.includes(shape)) throw new EditorError(`shape already in container: ${shape.id}`);
    this.nodes.splice(index, 0, shape);
  }
  remove(shape: Shape): void {
    const index = this.nodes.indexOf(shape);
    if (index < 0) throw new EditorError(`shape not in container: ${shape.id}`);
    this.nodes.splice(index, 1);
  }
  override move(dx: number, dy: number): void {
    Value.number(dx, 'dx'); Value.number(dy, 'dy');
    for (const node of this.nodes) node.move(dx, dy);
  }
  override scale(factor: number): void {
    Value.positive(factor, 'scale factor');
    for (const node of this.nodes) node.scale(factor);
  }
  protected override makeClone(): Group {
    const copy = new Group(this.id);
    for (const node of this.nodes) copy.insert(node.clone());
    return copy;
  }
  protected override geometryAttributes(): Record<string,string> { return {}; }
  protected override setOwnAttribute(_name: string, _value: string): boolean { return false; }
  override geometrySummary(): string { return ''; }
}
