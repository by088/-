import { EditorError } from './EditorError.js';

export class Value {
  static number(input: string | number, name: string): number {
    if (typeof input === 'string' && !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(input)) {
      throw new EditorError(`${name} must be a finite number`);
    }
    const value = Number(input);
    if (!Number.isFinite(value)) throw new EditorError(`${name} must be a finite number`);
    return Object.is(value, -0) ? 0 : value;
  }
  static nonnegative(input: string | number, name: string): number {
    const value = this.number(input, name);
    if (value < 0) throw new EditorError(`${name} must be non-negative`);
    return value;
  }
  static positive(input: string | number, name: string): number {
    const value = this.number(input, name);
    if (value <= 0) throw new EditorError(`${name} must be positive`);
    return value;
  }
  static id(id: string): string {
    if (!id || /[\s<>"'&]/u.test(id)) throw new EditorError(`invalid id: ${id}`);
    return this.xml(id);
  }
  static xml(value: string): string {
    for (const char of value) {
      const n = char.codePointAt(0)!;
      if (!(n === 9 || n === 10 || n === 13 || (n >= 32 && n <= 0xd7ff) || (n >= 0xe000 && n <= 0xfffd) || n >= 0x10000)) {
        throw new EditorError('text contains an invalid XML character');
      }
    }
    return value;
  }
  static count(args: readonly string[], min: number, max: number, syntax: string): void {
    if (args.length < min || args.length > max) throw new EditorError(`usage: ${syntax}`);
  }
}
