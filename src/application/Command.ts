import type { Session } from './Session.js';
export abstract class Command {
  abstract execute(session: Session): Promise<string[]>;
}
