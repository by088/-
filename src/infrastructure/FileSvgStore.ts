import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { dirname, basename, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { SvgStore } from '../application/SvgStore.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
import { EditorError } from '../domain/EditorError.js';
import { SvgCodec } from './SvgCodec.js';

export class FileSvgStore implements SvgStore {
  constructor(private readonly codec = new SvgCodec()) {}
  async read(path: string): Promise<{document: SvgDocument; warnings: string[]}> {
    let source: string;
    try { source = await readFile(path,'utf8'); }
    catch { throw new EditorError(`cannot read file: ${path}`); }
    return this.codec.decode(source);
  }
  async write(path: string, document: SvgDocument): Promise<void> {
    const content = this.codec.encode(document);
    const temporary = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
    try {
      await writeFile(temporary,content,{encoding: 'utf8',flag: 'wx'});
      await rename(temporary,path);
    } catch { throw new EditorError(`cannot write file: ${path}`); }
    finally { await unlink(temporary).catch(() => undefined); }
  }
}
