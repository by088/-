import { EditorError } from '../domain/EditorError.js';
import { Value } from '../domain/Value.js';

export class Transform {
  constructor(readonly factor = 1, readonly dx = 0, readonly dy = 0) {
    Value.positive(factor,'transform scale'); Value.number(dx,'transform x'); Value.number(dy,'transform y');
  }
  then(local: Transform): Transform { return new Transform(this.factor * local.factor, this.dx + this.factor * local.dx, this.dy + this.factor * local.dy); }
  static parse(source = ''): Transform {
    let result = new Transform(); let remaining = source.trim();
    while (remaining) {
      const match = /^(?:(translate)\s*\(([^()]*)\)|(scale)\s*\(([^()]*)\))/.exec(remaining);
      if (!match) throw new EditorError('unsupported transform: only translate and positive uniform scale are supported');
      const params = (match[2] ?? match[4] ?? '').trim().split(/[\s,]+/).filter(Boolean);
      Value.count(params,1,2,'translate(dx[,dy]) or scale(s[,s])');
      const a = Value.number(params[0]!, 'transform');
      const b = params[1] === undefined ? (match[1] ? 0 : a) : Value.number(params[1], 'transform');
      if (!match[1] && a !== b) throw new EditorError('unsupported transform: non-uniform scale');
      result = result.then(match[1] ? new Transform(1,a,b) : new Transform(a));
      remaining = remaining.slice(match[0].length).trimStart();
      if (remaining.startsWith(',')) remaining = remaining.slice(1).trimStart();
    }
    return result;
  }
}
