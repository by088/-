import { Session } from './application/Session.js';
import { CommandProcessor } from './cli/CommandProcessor.js';
import { Repl } from './cli/Repl.js';
import { FileSvgStore } from './infrastructure/FileSvgStore.js';

const interactive = Boolean(process.stdin.isTTY);
const success = await new Repl(new CommandProcessor(new Session(new FileSvgStore()))).run(process.stdin, process.stdout, interactive);
if (!interactive && !success) process.exitCode = 1;
