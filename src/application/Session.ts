import { SvgDocument } from '../domain/SvgDocument.js';
import { EditorError } from '../domain/EditorError.js';
import { History } from './History.js';
import type { SvgStore } from './SvgStore.js';

export class Session {
  private current: SvgDocument | undefined;
  private filename: string | undefined;
  readonly history = new History();
  constructor(readonly store: SvgStore) {}
  get document(): SvgDocument {
    if (!this.current) throw new EditorError("no document. use 'init' or 'read' first");
    return this.current;
  }
  get path(): string | undefined { return this.filename; }
  replace(document: SvgDocument): void { this.current = document; }
  commitIO(document: SvgDocument, path: string | undefined): void {
    this.current = document; this.filename = path; this.history.barrier();
  }
}
