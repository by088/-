import { Group } from './Group.js';
import { Shape } from './Shape.js';
import { Value } from './Value.js';
import { EditorError } from './EditorError.js';

type Location = { shape: Shape; parent: Group; index: number; ancestors: Group[] };

export class SvgDocument {
  private root = new Group('__document_root__');
  private w: number;
  private h: number;
  private viewport: string;
  constructor(width = 800, height = 600, viewBox?: string) {
    this.w = Value.positive(width, 'width'); this.h = Value.positive(height, 'height');
    this.viewport = viewBox ?? `0 0 ${this.w} ${this.h}`;
  }
  get width(): number { return this.w; }
  get height(): number { return this.h; }
  get viewBox(): string { return this.viewport; }
  get children(): readonly Shape[] { return this.root.children; }
  get count(): number { return this.locations().length; }
  rootPresentation(): Readonly<Record<string,string>> {
    const {id: _id, ...attributes} = this.root.attributes(); return attributes;
  }
  importRootPresentation(name: string, value: string): void { this.root.importPresentation(name, value); }
  clone(): SvgDocument {
    const copy = new SvgDocument(this.w, this.h, this.viewport);
    copy.root = this.root.clone() as Group; return copy;
  }
  resize(w: number, h: number): void {
    Value.positive(w, 'width'); Value.positive(h, 'height');
    this.w = w; this.h = h; this.viewport = `0 0 ${w} ${h}`;
  }
  private locations(parent = this.root, ancestors: Group[] = []): Location[] {
    return parent.children.flatMap((shape,index) => {
      const location = {shape,parent,index,ancestors: [...ancestors,parent]};
      return [location, ...(shape instanceof Group ? this.locations(shape, location.ancestors) : [])];
    });
  }
  private locate(id: string): Location {
    const location = this.locations().find(item => item.shape.id === id);
    if (!location) throw new EditorError(`no such shape: ${id}`);
    return location;
  }
  find(id: string): Shape { return this.locate(id).shape; }
  has(id: string): boolean { return this.locations().some(item => item.shape.id === id); }
  parentLabel(id: string): string { const p = this.locate(id).parent; return p === this.root ? 'svg' : p.label; }
  container(id: string): Group {
    if (!this.has(id)) throw new EditorError(`no such container: ${id}`);
    const shape = this.find(id);
    if (!(shape instanceof Group)) throw new EditorError(`not a container: ${id}`);
    return shape;
  }
  add(shape: Shape, parentId?: string): void {
    const pending = [shape]; const seen = new Set<string>();
    while (pending.length) {
      const next = pending.pop()!;
      if (seen.has(next.id) || this.has(next.id)) throw new EditorError(`id already exists: ${next.id}`);
      seen.add(next.id); pending.push(...next.children);
    }
    const parent = parentId === undefined ? this.root : this.container(parentId);
    parent.insert(shape);
  }
  delete(id: string): Shape { const loc = this.locate(id); loc.parent.remove(loc.shape); return loc.shape; }
  addTo(gid: string, id: string): void {
    const target = this.container(gid); const loc = this.locate(id);
    if (loc.shape === target || (loc.shape instanceof Group && loc.shape.contains(target))) throw new EditorError(`cannot group a container into its own descendant: ${id}`);
    loc.parent.remove(loc.shape); target.insert(loc.shape);
  }
  group(id: string, ids: readonly string[]): Group {
    Value.id(id);
    if (this.has(id)) throw new EditorError(`id already exists: ${id}`);
    if (!ids.length) throw new EditorError('group requires at least one shape');
    if (new Set(ids).size !== ids.length) throw new EditorError('duplicate shape in group');
    const selected = ids.map(key => this.locate(key));
    for (const loc of selected) {
      if (loc.shape instanceof Group && selected.some(other => other !== loc && (loc.shape as Group).contains(other.shape))) throw new EditorError(`cannot group a container into its own descendant: ${loc.shape.id}`);
    }
    const ordered = this.locations().filter(loc => ids.includes(loc.shape.id));
    const shared = ordered[0]!.ancestors.filter(a => ordered.every(loc => loc.ancestors.includes(a)));
    const parent = shared.at(-1)!;
    const branches = parent.children;
    const index = branches.findIndex(branch => ordered.some(loc => branch === loc.shape || (branch instanceof Group && branch.contains(loc.shape))));
    const group = new Group(id);
    for (const loc of ordered) { loc.parent.remove(loc.shape); group.insert(loc.shape); }
    parent.insert(group, index); return group;
  }
  ungroup(id: string): void {
    const loc = this.locate(id); const shape = loc.shape;
    if (!(shape instanceof Group)) throw new EditorError(`not a container: ${id}`);
    if (loc.parent === this.root) throw new EditorError(`cannot ungroup top-level container: ${id}`);
    // Group opacity is compositing, not inheritance; cannot flatten it losslessly.
    if (shape.attributes().opacity !== undefined && shape.attributes().opacity !== '1') throw new EditorError(`cannot ungroup container with opacity: ${id}`);
    const children = shape.children;
    loc.parent.remove(shape);
    children.forEach((child,i) => { shape.remove(child); child.inheritPresentation(shape); loc.parent.insert(child, loc.index+i); });
  }
  reorder(id: string, front: boolean): void {
    const loc = this.locate(id); loc.parent.remove(loc.shape);
    loc.parent.insert(loc.shape, front ? loc.parent.children.length : 0);
  }
}
