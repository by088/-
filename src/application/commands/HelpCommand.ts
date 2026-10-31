import { Command } from '../Command.js';
import { Value } from '../../domain/Value.js';

export class HelpCommand extends Command {
  constructor(args: readonly string[]) { super(); Value.count(args,0,0,'help'); }
  override async execute(): Promise<string[]> {
    return [
      'init [w] [h]                       new canvas (800x600 by default)',
      'read <file.svg>                     read an SVG document',
      'save [file.svg]                     save to a file / current path',
      'canvas [w h]                       show / resize canvas',
      'create <type> <id> [params] [in <containerId>]',
      '  rect <id> <x> <y> <w> <h> [fill]',
      '  circle <id> <cx> <cy> <r> [fill]',
      '  ellipse <id> <cx> <cy> <rx> <ry> [fill]',
      '  line <id> <x1> <y1> <x2> <y2> [stroke]',
      '  text <id> <x> <y> "content"',
      '  g <id>',
      'delete <id>                        delete a shape/subtree',
      'move <id> <dx> <dy>                 translate geometry',
      'scale <id> <factor>                 scale coordinates and sizes (>0)',
      'set <id> <attr> <value>             set geometry, text, fill, stroke or stroke-width',
      'group <newGid> <id1> <id2>…          group existing shapes',
      'ungroup <gid>                      dissolve a non-top-level group',
      'addto <gid> <id>                    reparent as last child',
      'front <id> / back <id>              change sibling paint order',
      'tree [id] / show <id>               display structure / attributes',
      'undo / redo                        one editing command per step',
      'help                               show this help',
      '# comment                          comments occupy a whole line',
      'EOF (Ctrl-D)                       leave the editor',
    ];
  }
}
