import { CommandRegistry } from '../application/CommandRegistry.js';
import { Session } from '../application/Session.js';
import { Tokenizer } from './Tokenizer.js';

export class CommandProcessor {
  constructor(private readonly session: Session, private readonly registry = new CommandRegistry(), private readonly tokenizer = new Tokenizer()) {}
  async execute(line: string): Promise<string[]> {
    try {
      const tokens = this.tokenizer.parse(line);
      if (!tokens.length) return [];
      return await this.registry.create(tokens[0]!, tokens.slice(1)).execute(this.session);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return [`error: ${message.replace(/[\r\n]+/g, ' ')}`];
    }
  }
}
