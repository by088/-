import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';
import { TestRig } from './TestRig.js';

const codec = new SvgCodec();

test('missing IDs reserve later explicit IDs and report exact warnings',() => {
  const result = codec.decode('<svg width="400" height="300"><rect/><g><circle/></g><rect id="rect1"/><rect/><g id="g1"/></svg>');
  assert.deepEqual(result.warnings,['warning: assigned id rect2 to unnamed <rect>','warning: assigned id g2 to unnamed <g>','warning: assigned id circle1 to unnamed <circle>','warning: assigned id rect3 to unnamed <rect>']);
  assert.equal(result.document.count,6); assert.equal(result.document.width,400);
});

test('roundtrip preserves all shapes, hierarchy, paint order, Unicode and escaped text',async () => {
  const r=new TestRig(); await r.run('init 400 300','create g scene','create rect r 0.5 -2 30 40 #fff in scene','create circle c 1 2 3 in scene','create ellipse e 1 2 3 4','create line l 1 2 3 4 red',String.raw`create text t 1 2 "开始 & <end> \"你好\""`,'set scene fill blue','set r stroke-width 2');
  const original=r.snapshot(); assert.match(original,/&amp;/); assert.match(original,/&lt;end&gt;/);
  const decoded=codec.decode(original); assert.deepEqual(decoded.warnings,[]); assert.equal(codec.encode(decoded.document),original);
});

test('empty text, CDATA, comments, prefixed namespace and viewBox survive semantic roundtrip',() => {
  const {document}=codec.decode('<?xml version="1.0"?><s:svg xmlns:s="http://www.w3.org/2000/svg" width="400px" height="200px" viewBox="-10 -20 800 400"><!-- hi --><s:text id="t"><![CDATA[A < B & C]]></s:text><s:text id="empty"/></s:svg>');
  assert.equal(document.viewBox,'-10 -20 800 400'); assert.equal(document.find('t').textContent,'A < B & C'); assert.equal(document.find('empty').textContent,'');
  assert.equal(codec.decode(codec.encode(document)).document.viewBox,document.viewBox);
});

test('translate/uniform scale are normalized in nested SVG transform order',() => {
  const {document}=codec.decode('<svg width="400" height="200"><g id="g" transform="translate(60,40)" fill="red"><rect id="a" width="120" height="60"/><g id="b" transform="translate(200,0) scale(0.8)"><rect id="r" width="120" height="60"/><text id="t" x="60" y="38" font-size="16" text-anchor="middle">End</text></g></g></svg>');
  assert.equal(document.find('r').attributes().x,'260'); assert.equal(document.find('r').attributes().width,'96');
  assert.equal(document.find('t').attributes().x,'308'); assert.equal(document.find('t').attributes()['font-size'],'12.8');
  assert.equal(document.find('t').attributes()['text-anchor'],'middle');
  assert.equal(codec.encode(codec.decode(codec.encode(document)).document),codec.encode(document));
});

test('unsupported and malformed input is rejected instead of silently discarding artwork',() => {
  for(const source of [
    '<not-svg/>','<svg><g></svg>','<svg><rect id="a"/><circle id="a"/></svg>',
    '<svg><rect id=""/></svg>','<svg><path id="p"/></svg>',
    '<svg><rect id="r" onload="x"/></svg>','<svg><text id="t"><tspan>x</tspan></text></svg>',
    '<svg xmlns="urn:other"/>','<svg viewBox="0 0 1"/>','<svg viewBox="0 0 -1 1"/>',
    '<svg width="100%"/>','<svg><g transform="rotate(30)"/></svg>',
    '<svg><g transform="scale(1,2)"/></svg>','<svg><g transform="scale(-1)"/></svg>',
    '<!DOCTYPE svg [<!ENTITY x "hello">]><svg/>','<svg><text>&unknown;</text></svg>',
    '<svg>unexpected</svg>','<svg><rect>unexpected</rect></svg>',
  ]) assert.throws(()=>codec.decode(source),undefined,source);
});

test('data-kind box imports as ordinary group in Phase 1',() => {
  const {document}=codec.decode('<svg><g id="b" data-kind="box"><rect id="b-rect"/><text id="b-label">hello</text></g></svg>');
  assert.equal(document.find('b').tag,'g'); assert.equal(document.count,3); assert.match(codec.encode(document),/data-kind="box"/);
});

test('save/read path retention and document barriers work through real filesystem',async t => {
  const dir=await mkdtemp(join(tmpdir(),'svg-cli-')); t.after(()=>rm(dir,{recursive:true,force:true}));
  const path=join(dir,'含 空格.svg'); const r=new TestRig();
  await r.run('init','create text t 1 2 "开始"',`save "${path}"`); await r.error('undo','undo not allowed after io command');
  assert.equal(r.session.path,path); await r.run('set t text 修改','save'); await r.error('redo','undo not allowed after io command');
  await r.run('init',`read "${path}"`); assert.equal(r.session.document.find('t').textContent,'修改');
  await r.error('undo','undo not allowed after io command'); assert.equal(r.session.path,path);
  assert.match(await readFile(path,'utf8'),/修改/); assert.deepEqual(await readdir(dir),['含 空格.svg']);
});

test('failed reads/writes keep canvas, current path and redo; warning is not leaked on failed import',async t => {
  const dir=await mkdtemp(join(tmpdir(),'svg-cli-')); t.after(()=>rm(dir,{recursive:true,force:true}));
  const path=join(dir,'valid.svg'); const bad=join(dir,'bad.svg'); const missing=join(dir,'missing.svg');
  await writeFile(bad,'<svg><rect/><path/></svg>');
  const r=new TestRig(); await r.run('init','create g g',`save "${path}"`,'create g h','undo'); const before=r.snapshot();
  await r.error(`read "${missing}"`,`cannot read file: ${missing}`);
  await r.error(`read "${bad}"`,/unknown shape type: path/);
  const target=join(dir,'absent','out.svg'); await r.error(`save "${target}"`,`cannot write file: ${target}`);
  await r.error(`save "${dir}"`,`cannot write file: ${dir}`);
  assert.equal(r.snapshot(),before); assert.equal(r.session.path,path); await r.run('redo'); assert.equal(r.session.document.has('h'),true);
  assert.deepEqual((await readdir(dir)).sort(),['bad.svg','valid.svg']);
});

test('an imported group with compositing opacity cannot be flattened silently',async () => {
  const r=new TestRig(); r.session.commitIO(codec.decode('<svg><g id="scene"><g id="g" opacity="0.5"><rect id="r"/></g></g></svg>').document,undefined);
  const before=r.snapshot(); await r.error('ungroup g','cannot ungroup container with opacity: g'); assert.equal(r.snapshot(),before);
});

test('root id is preserved and reserved across cloning and subsequent edits',async () => {
  const r=new TestRig(); r.session.commitIO(codec.decode('<svg id="canvas"><g id="scene"/></svg>').document,undefined);
  assert.match(r.snapshot(),/id="canvas"/);
  await r.error('create g canvas','id already exists: canvas');
  await r.error('group canvas scene','id already exists: canvas');
  await r.run('create g child','undo','redo'); assert.match(r.snapshot(),/id="canvas"/);
});

test('XML text attribute is rejected: text content must be a child text node',() => {
  assert.throws(()=>codec.decode('<svg><text id="t" text="lost"/></svg>'),/unsupported SVG attribute: text/);
  assert.throws(()=>codec.decode('<svg><g __proto__="lost"/></svg>'),/unsupported SVG attribute: __proto__/);
});
