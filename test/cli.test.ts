import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { Readable, Writable } from 'node:stream';
import { Tokenizer } from '../src/cli/Tokenizer.js';
import { Repl } from '../src/cli/Repl.js';
import { TestRig } from './TestRig.js';

test('tokenizer keeps hex colors, quoted spaces, empty strings and escaped characters',()=>{
  const t=new Tokenizer();
  assert.deepEqual(t.parse(' # comment'),[]); assert.deepEqual(t.parse('  '),[]);
  assert.deepEqual(t.parse('create text t 0 0 "hello world"'),['create','text','t','0','0','hello world']);
  assert.deepEqual(t.parse('set t text ""'),['set','t','text','']);
  assert.deepEqual(t.parse('set r fill #4a90d9'),['set','r','fill','#4a90d9']);
  assert.deepEqual(t.parse(String.raw`set t text "A\nB\t\"C\"\\"`),['set','t','text','A\nB\t"C"\\']);
  assert.throws(()=>t.parse('set t text "oops'),/unterminated/);
});

test('interactive REPL shows svg prompt and continues after an error',async()=>{
  const r=new TestRig(); let output=''; const sink=new Writable({write(chunk,_encoding,callback){output+=chunk.toString();callback();}});
  const ok=await new Repl(r.cli).run(Readable.from(['init\nunknown\ncanvas\n']),sink,true);
  assert.equal(ok,false); assert.match(output,/svg-editor 0.1/); assert.equal(output.match(/svg> /g)?.length,4); assert.match(output,/canvas 800x600/);
});

test('real CLI script supports comments, CRLF, error recovery and nonzero exit',()=>{
  const run=spawnSync(process.execPath,['--import','tsx','src/main.ts'],{encoding:'utf8',input:'# script\r\ninit\r\ncreate g scene\r\nunknown\r\ntree\r\n'});
  assert.equal(run.status,1,run.stderr); assert.match(run.stdout,/error: unknown command: unknown/); assert.match(run.stdout,/g#scene/); assert.doesNotMatch(run.stdout,/svg>/);
});

test('real CLI successful script exits zero',()=>{
  const run=spawnSync(process.execPath,['--import','tsx','src/main.ts'],{encoding:'utf8',input:'init\ncreate g scene\ntree\n'});
  assert.equal(run.status,0,run.stderr); assert.match(run.stdout,/g#scene/);
});
