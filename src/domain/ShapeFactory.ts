import { Shape } from './Shape.js';
import { Group } from './Group.js';
import { Rect } from './Rect.js';
import { Circle } from './Circle.js';
import { Ellipse } from './Ellipse.js';
import { Line } from './Line.js';
import { Text } from './Text.js';
import { Value } from './Value.js';
import { EditorError } from './EditorError.js';

type Definition = { keys: readonly string[]; paint?: string; build: (id: string, values: number[], content: string) => Shape };

export class ShapeFactory {
  // Name dispatch point 1/2; replace built-in definitions with providers in Phase 2.
  private readonly definitions = new Map<string, Definition>([
    ['rect', {keys: ['x','y','width','height'], paint: 'fill', build: (id, n) => new Rect(id,n[0]!,n[1]!,n[2]!,n[3]!)}],
    ['circle', {keys: ['cx','cy','r'], paint: 'fill', build: (id, n) => new Circle(id,n[0]!,n[1]!,n[2]!)}],
    ['ellipse', {keys: ['cx','cy','rx','ry'], paint: 'fill', build: (id, n) => new Ellipse(id,n[0]!,n[1]!,n[2]!,n[3]!)}],
    ['line', {keys: ['x1','y1','x2','y2'], paint: 'stroke', build: (id, n) => new Line(id,n[0]!,n[1]!,n[2]!,n[3]!)}],
    ['text', {keys: ['x','y','text'], build: (id, n, content) => new Text(id,n[0]!,n[1]!,content)}],
    ['g', {keys: [], build: id => new Group(id)}],
  ]);
  private definition(tag: string): Definition {
    const found = this.definitions.get(tag);
    if (!found) throw new EditorError(`unknown shape type: ${tag} (is the plugin loaded?)`);
    return found;
  }
  create(tag: string, id: string, args: readonly string[]): Shape {
    const def = this.definition(tag);
    Value.count(args, def.keys.length, def.keys.length + (def.paint ? 1 : 0), `create ${tag} <id> ${def.keys.map(k => `<${k}>`).join(' ')}${def.paint ? ` [${def.paint}]` : ''} [in <containerId>]`);
    const values = def.keys.filter(k => k !== 'text').map((k, i) => Value.number(args[i]!, k));
    const shape = def.build(id, values, args[def.keys.indexOf('text')] ?? '');
    if (def.paint && args.length > def.keys.length) shape.set(def.paint, args[def.keys.length]!);
    return shape;
  }
  fromSvg(tag: string, id: string, attrs: Readonly<Record<string,string>>, content: string): Shape {
    const def = this.definition(tag);
    const args = def.keys.map(key => key === 'text' ? content : attrs[key] ?? '0');
    const shape = this.create(tag, id, args);
    for (const [key,value] of Object.entries(attrs)) {
      if (key !== 'id' && key !== 'transform' && key !== 'xmlns' && !def.keys.includes(key)) shape.importPresentation(key, value);
    }
    return shape;
  }
}
