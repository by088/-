import { GeometryShape } from './GeometryShape.js';

export class Circle extends GeometryShape {
  constructor(id: string, cx: number, cy: number, r: number) {
    super('circle', id, {cx,cy,r}, ["cx"], ["cy"], ["r"]);
  }
  protected override makeClone(): Circle { return new Circle(this.id, this.n('cx'), this.n('cy'), this.n('r')); }
}
