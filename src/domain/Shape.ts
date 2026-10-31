import { EditorError } from './EditorError.js';
import { Value } from './Value.js';

export abstract class Shape {
  private readonly identity: string;
  private readonly presentation = new Map<string, string>();
  protected constructor(private readonly kind: string, id: string) { this.identity = Value.id(id); }
  get id(): string { return this.identity; }
  get tag(): string { return this.kind; }
  get label(): string { return `${this.tag}#${this.id}`; }
  get children(): readonly Shape[] { return []; }
  get textContent(): string | undefined { return undefined; }
  get locationText(): string { return ''; }
  abstract move(dx: number, dy: number): void;
  abstract scale(factor: number): void;
  protected abstract makeClone(): Shape;
  protected abstract geometryAttributes(): Record<string, string>;
  protected abstract setOwnAttribute(name: string, value: string): boolean;
  abstract geometrySummary(): string;
  clone(): Shape {
    const copy = this.makeClone();
    for (const [key, value] of this.presentation) copy.presentation.set(key, value);
    return copy;
  }
  set(name: string, value: string): void {
    Value.xml(value);
    if (['fill', 'stroke', 'stroke-width'].includes(name)) {
      this.presentation.set(name, name === 'stroke-width' ? String(Value.nonnegative(value, name)) : value);
    } else if (!this.setOwnAttribute(name, value)) {
      throw new EditorError(`unknown attribute: ${name}`);
    }
  }
  importPresentation(name: string, value: string): void {
    const allowed = ['opacity', 'fill-opacity', 'stroke-opacity', 'font-size', 'font-family', 'font-weight', 'text-anchor', 'dominant-baseline', 'stroke-linecap', 'stroke-linejoin'];
    if (['fill', 'stroke', 'stroke-width'].includes(name)) this.set(name, value);
    else if (allowed.includes(name) || /^data-[\w-]+$/.test(name)) this.presentation.set(name, Value.xml(value));
    else throw new EditorError(`unsupported SVG attribute: ${name}`);
  }
  inheritPresentation(source: Shape): void {
    // SVG inherited properties survive dissolution of a group.
    const inherited = ['fill', 'stroke', 'stroke-width', 'fill-opacity', 'stroke-opacity', 'font-size', 'font-family', 'font-weight', 'text-anchor', 'dominant-baseline', 'stroke-linecap', 'stroke-linejoin'];
    for (const [key, value] of source.presentation) {
      if (inherited.includes(key) && !this.presentation.has(key)) this.presentation.set(key, value);
    }
  }
  attributes(): Readonly<Record<string, string>> {
    return { id: this.id, ...this.geometryAttributes(), ...Object.fromEntries(this.presentation) };
  }
  summary(): string {
    const style = [...this.presentation].map(([k, v]) => `${k}=${JSON.stringify(v).slice(1, -1)}`).join(' ');
    return [this.label, this.geometrySummary(), style].filter(Boolean).join('  ');
  }
}
