import { GeometryShape } from './GeometryShape.js';

export class Line extends GeometryShape {
  constructor(id: string, x1: number, y1: number, x2: number, y2: number) {
    super('line', id, {x1,y1,x2,y2}, ["x1", "x2"], ["y1", "y2"], []);
  }
  protected override makeClone(): Line { return new Line(this.id, this.n('x1'), this.n('y1'), this.n('x2'), this.n('y2')); }
  override geometrySummary(): string { return `(${this.n('x1')},${this.n('y1')}) -> (${this.n('x2')},${this.n('y2')})`; }
}
