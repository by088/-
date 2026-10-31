import { GeometryShape } from './GeometryShape.js';

export class Rect extends GeometryShape {
  constructor(id: string, x: number, y: number, width: number, height: number) {
    super('rect', id, {x,y,width,height}, ["x"], ["y"], ["width", "height"]);
  }
  protected override makeClone(): Rect { return new Rect(this.id, this.n('x'), this.n('y'), this.n('width'), this.n('height')); }
  override geometrySummary(): string { return `x=${this.n('x')} y=${this.n('y')} w=${this.n('width')} h=${this.n('height')}`; }
}
