import { Shape } from './Shape.js';
import { Value } from './Value.js';

export abstract class GeometryShape extends Shape {
  private readonly geometry = new Map<string, number>();
  protected constructor(tag: string, id: string, values: Record<string, number>, private readonly xKeys: readonly string[], private readonly yKeys: readonly string[], private readonly sizes: readonly string[]) {
    super(tag, id);
    for (const [key, value] of Object.entries(values)) this.geometry.set(key, this.validate(key, value));
  }
  protected n(key: string): number { return this.geometry.get(key)!; }
  private validate(key: string, value: string | number): number {
    return this.sizes.includes(key) ? Value.nonnegative(value, key) : Value.number(value, key);
  }
  override move(dx: number, dy: number): void {
    Value.number(dx, 'dx'); Value.number(dy, 'dy');
    const next = new Map(this.geometry);
    for (const key of this.xKeys) next.set(key, Value.number(this.n(key) + dx, key));
    for (const key of this.yKeys) next.set(key, Value.number(this.n(key) + dy, key));
    for (const [key, value] of next) this.geometry.set(key, value);
  }
  override scale(factor: number): void {
    Value.positive(factor, 'scale factor');
    const next = [...this.geometry].map(([key, value]) => [key, Value.number(value * factor, key)] as const);
    for (const [key, value] of next) this.geometry.set(key, value);
  }
  protected override geometryAttributes(): Record<string, string> {
    return Object.fromEntries([...this.geometry].map(([k, v]) => [k, String(v)]));
  }
  protected override setOwnAttribute(name: string, value: string): boolean {
    if (!this.geometry.has(name)) return false;
    this.geometry.set(name, this.validate(name, value)); return true;
  }
  override geometrySummary(): string { return [...this.geometry].map(([k,v]) => `${k}=${v}`).join(' '); }
  override get locationText(): string { return `(${this.n(this.xKeys[0]!)},${this.n(this.yKeys[0]!)})`; }
}
