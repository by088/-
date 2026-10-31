import type { SvgDocument } from '../domain/SvgDocument.js';

export interface SvgStore {
  read(path: string): Promise<{ document: SvgDocument; warnings: string[] }>;
  write(path: string, document: SvgDocument): Promise<void>;
}
