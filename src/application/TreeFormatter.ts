import type { SvgDocument } from '../domain/SvgDocument.js';
import type { Shape } from '../domain/Shape.js';

export class TreeFormatter {
  tree(document: SvgDocument, id?: string): string[] {
    if (id !== undefined) { const shape = document.find(id); return [shape.summary(), ...this.branches(shape.children, '')]; }
    return [`svg (${document.width}x${document.height})`, ...this.branches(document.children, '')];
  }
  private branches(children: readonly Shape[], prefix: string): string[] {
    return children.flatMap((shape,i) => {
      const last = i === children.length-1;
      return [prefix + (last ? '└── ' : '├── ') + shape.summary(), ...this.branches(shape.children, prefix + (last ? '    ' : '│   '))];
    });
  }
  show(document: SvgDocument, id: string): string[] {
    const shape = document.find(id);
    const entries = Object.entries(shape.attributes()).filter(([key]) => key !== 'id').map(([key,value]) => `  ${key}=${JSON.stringify(value).slice(1,-1)}`);
    if (shape.textContent !== undefined) entries.push(`  text=${JSON.stringify(shape.textContent)}`);
    return [`${shape.label}  parent=${document.parentLabel(id)}`, ...entries];
  }
}
