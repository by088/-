import { GeometryShape } from './GeometryShape.js';
import { Value } from './Value.js';

export class Text extends GeometryShape {
  private content: string;
  constructor(id: string, x: number, y: number, content: string) {
    super('text', id, {x,y}, ['x'], ['y'], []); this.content = Value.xml(content);
  }
  override get textContent(): string { return this.content; }
  protected override makeClone(): Text { return new Text(this.id, this.n('x'), this.n('y'), this.content); }
  protected override setOwnAttribute(name: string, value: string): boolean {
    if (name === 'text') { this.content = Value.xml(value); return true; }
    return super.setOwnAttribute(name, value);
  }
  override geometrySummary(): string { return `${this.locationText} ${JSON.stringify(this.content)}`; }
}
