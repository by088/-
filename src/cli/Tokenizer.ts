export class Tokenizer {
  parse(line: string): string[] {
    if (line.trimStart().startsWith('#')) return [];
    const tokens: string[] = []; let token = ''; let quoted = false; let started = false;
    for (let i=0; i<line.length; i++) {
      const char = line[i]!;
      if (char === '"') { quoted = !quoted; started = true; }
      else if (char === '\\' && quoted && i+1 < line.length) {
        const next = line[i+1]!;
        const escapes: Record<string,string> = {'n': '\n', 'r': '\r', 't': '\t', '"': '"', '\\': '\\'};
        if (Object.hasOwn(escapes,next)) { token += escapes[next]!; i++; } else token += char;
        started = true;
      } else if (/\s/.test(char) && !quoted) {
        if (started) { tokens.push(token); token = ''; started = false; }
      } else { token += char; started = true; }
    }
    if (quoted) throw new SyntaxError('unterminated double quote');
    if (started) tokens.push(token);
    return tokens;
  }
}
