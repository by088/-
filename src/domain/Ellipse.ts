import { GeometryShape } from './GeometryShape.js';

export class Ellipse extends GeometryShape {
  constructor(id: string, cx: number, cy: number, rx: number, ry: number) {
    super('ellipse', id, {cx,cy,rx,ry}, ["cx"], ["cy"], ["rx", "ry"]);
  }
  protected override makeClone(): Ellipse { return new Ellipse(this.id, this.n('cx'), this.n('cy'), this.n('rx'), this.n('ry')); }
}
