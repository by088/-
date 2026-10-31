import test from 'node:test';
import assert from 'node:assert/strict';
import { TestRig } from './TestRig.js';

const cases: [string,string,Record<string,string>][] = [
  ['rect','1 2 30 40 red',{x:'1',y:'2',width:'30',height:'40',fill:'red'}],
  ['circle','1 2 3 blue',{cx:'1',cy:'2',r:'3',fill:'blue'}],
  ['ellipse','1 2 3 4',{cx:'1',cy:'2',rx:'3',ry:'4'}],
  ['line','1 2 3 4 black',{x1:'1',y1:'2',x2:'3',y2:'4',stroke:'black'}],
  ['text','1 2 "你好 world"',{x:'1',y:'2'}],
  ['g','',{}],
];
for (const [tag,params,attrs] of cases) {
  test(`create ${tag} with explicit parent, show, delete, undo and redo`,async () => {
    const r = new TestRig(); await r.run('init','create g scene',`create ${tag} s ${params} in scene`);
    assert.deepEqual(r.attrs('s'),{id:'s',...attrs});
    assert.match((await r.run('show s'))[0]!,new RegExp(`${tag}#s  parent=g#scene`));
    const before = r.snapshot(); await r.run('delete s'); assert.equal(r.session.document.has('s'),false);
    await r.run('undo'); assert.equal(r.snapshot(),before); await r.run('redo'); assert.equal(r.session.document.has('s'),false);
  });
}

test('help is available before initialization; other document operations require document',async () => {
  const r = new TestRig(); assert.match((await r.run('help')).join('\n'),/create <type>/);
  for (const line of ['tree','show x','undo','redo','canvas','save','create g g','move r 1 2']) await r.error(line,"no document. use 'init' or 'read' first");
});

test('default canvas and partial init dimensions',async () => {
  const r = new TestRig(); await r.run('init'); assert.equal(r.session.document.width,800); assert.equal(r.session.document.height,600);
  await r.run('init 123'); assert.equal(r.session.document.width,123); assert.equal(r.session.document.height,600);
});

test('all six types accept common styles and preserve absent defaults',async () => {
  const r = new TestRig(); await r.run('init');
  for (const [tag,params] of cases) {
    await r.run(`create ${tag} ${tag} ${params}`,`set ${tag} fill #fff`,`set ${tag} stroke blue`,`set ${tag} stroke-width 2.5`);
    assert.equal(r.attrs(tag)['stroke-width'],'2.5');
  }
  await r.run('create rect noPaint 0 0 1 1','create line invisible 0 0 1 1');
  assert.equal(r.attrs('noPaint').fill,undefined); assert.equal(r.attrs('invisible').stroke,undefined);
});

test('recursive move and scale update each leaf exactly once and all geometric fields',async () => {
  const r = new TestRig(); await r.run('init','create g scene','create g nested in scene');
  for (const [tag,params] of cases.filter(c => c[0] !== 'g')) await r.run(`create ${tag} ${tag} ${params} in nested`);
  const initial = r.snapshot(); await r.run('move scene 10 -5','scale scene 2');
  assert.deepEqual(r.attrs('rect'),{id:'rect',x:'22',y:'-6',width:'60',height:'80',fill:'red'});
  assert.equal(r.attrs('circle').r,'6'); assert.equal(r.attrs('ellipse').ry,'8');
  assert.deepEqual(r.attrs('line'),{id:'line',x1:'22',y1:'-6',x2:'26',y2:'-2',stroke:'black'});
  assert.equal(r.attrs('text').x,'22'); assert.equal(r.session.document.find('text').textContent,'你好 world');
  await r.run('undo','undo'); assert.equal(r.snapshot(),initial);
});

test('set type-specific geometry and text; styles do not scale with geometry',async () => {
  const r = new TestRig(); await r.run('init');
  for (const [tag,params,attrs] of cases) {
    await r.run(`create ${tag} ${tag} ${params}`);
    for (const key of Object.keys(attrs).filter(key => !['fill','stroke'].includes(key))) {
      await r.run(`set ${tag} ${key} 2.25`); assert.equal(r.attrs(tag)[key],'2.25');
    }
  }
  await r.run(String.raw`set text text "a & <b> \"quoted\""`,'set rect stroke-width 3','scale rect 2');
  assert.equal(r.session.document.find('text').textContent,'a & <b> "quoted"'); assert.equal(r.attrs('rect')['stroke-width'],'3');
});

test('geometry errors and unknown attributes leave document and redo history intact',async () => {
  const r = new TestRig(); await r.run('init','create rect r 1 2 3 4','move r 2 3','undo'); const before = r.snapshot();
  const errors: [string,string | RegExp][] = [
    ['create rect r 0 0 1 1','id already exists: r'], ['delete missing','no such shape: missing'],
    ['create g x in missing','no such container: missing'], ['create g x in r','not a container: r'],
    ['create box b 0 0 1 1 title','unknown shape type: box (is the plugin loaded?)'],
    ['scale r 0','scale factor must be positive'],['scale r -1','scale factor must be positive'],
    ['set r id another','unknown attribute: id'],['set r r 2','unknown attribute: r'],
    ['set r width -1','width must be non-negative'],['set r stroke-width -2','stroke-width must be non-negative'],
    ['move r NaN 0',/finite number/],['move r Infinity 0',/finite number/],['move r 1px 0',/finite number/],
    ['create rect x 0 0 -1 1',/non-negative/],['create g "bad id"',/invalid id/],
    ['canvas 0 10',/positive/],['init -1',/positive/],['set r fill "unterminated',/unterminated/],
    ['save','no file path. use save <file.svg>'],
  ];
  for (const [line,error] of errors) { await r.error(line,error); assert.equal(r.snapshot(),before,line); }
  await r.run('redo'); assert.equal(r.attrs('r').x,'3');
});

test('overflow in a later descendant never commits an earlier descendant mutation',async () => {
  const r = new TestRig(); await r.run('init','create g scene','create circle first 1 1 1 in scene','create rect huge 1e308 0 1 1 in scene');
  const before = r.snapshot(); await r.error('scale scene 10',/finite number/); assert.equal(r.snapshot(),before);
  await r.run('undo'); assert.equal(r.session.document.has('huge'),false);
});

test('group preserves document order rather than argument order and is one undo unit',async () => {
  const r = new TestRig(); await r.run('init','create rect a 0 0 1 1','create circle b 0 0 1','create text c 0 0 C');
  const before = r.snapshot(); await r.run('group bundle c a');
  assert.deepEqual(r.session.document.children.map(s => s.id),['bundle','b']);
  assert.deepEqual(r.session.document.find('bundle').children.map(s => s.id),['a','c']);
  await r.run('undo'); assert.equal(r.snapshot(),before); await r.run('redo'); assert.equal(r.session.document.count,4);
});

test('group from distinct parents uses nearest common ancestor and original DFS order',async () => {
  const r = new TestRig(); await r.run('init','create g scene','create g left in scene','create g right in scene','create g a in left','create g b in right','group combined b a');
  assert.equal(r.session.document.parentLabel('combined'),'g#scene');
  assert.deepEqual(r.session.document.find('combined').children.map(s=>s.id),['a','b']);
  assert.deepEqual(r.session.document.find('scene').children.map(s=>s.id),['combined','left','right']);
});

test('cycles, duplicate selections, leaf containers and top-level ungroup are rejected atomically',async () => {
  const r = new TestRig(); await r.run('init','create g outer','create g inner in outer','create rect r 0 0 1 1 in inner'); const before = r.snapshot();
  for (const line of ['group bad outer r','group bad r outer','addto inner outer','addto outer outer']) {
    await r.error(line,'cannot group a container into its own descendant: outer'); assert.equal(r.snapshot(),before);
  }
  await r.error('group bad r r','duplicate shape in group');
  await r.error('ungroup outer','cannot ungroup top-level container: outer');
  await r.error('ungroup r','not a container: r');
  await r.error('addto r inner','not a container: r');
  assert.equal(r.snapshot(),before);
});

test('ungroup replaces group in place, preserves inherited styling, supports empty group',async () => {
  const r = new TestRig(); await r.run('init','create g scene','create g first in scene','create g middle in scene','create g last in scene','create rect a 0 0 1 1 in middle','create circle b 0 0 1 blue in middle','set middle fill red');
  const before = r.snapshot(); await r.run('ungroup middle');
  assert.deepEqual(r.session.document.find('scene').children.map(s=>s.id),['first','a','b','last']);
  assert.equal(r.attrs('a').fill,'red'); assert.equal(r.attrs('b').fill,'blue');
  await r.run('undo'); assert.equal(r.snapshot(),before); await r.run('ungroup first'); assert.equal(r.session.document.has('first'),false);
});

test('addto appends and z-order stays within sibling set',async () => {
  const r = new TestRig(); await r.run('init','create g scene','create g a in scene','create g b in scene','create g c','addto scene c');
  assert.deepEqual(r.session.document.find('scene').children.map(s=>s.id),['a','b','c']);
  const before = r.snapshot(); await r.run('front a'); assert.deepEqual(r.session.document.find('scene').children.map(s=>s.id),['b','c','a']);
  await r.run('back a'); assert.equal(r.snapshot(),before); await r.run('addto scene a');
  assert.deepEqual(r.session.document.find('scene').children.map(s=>s.id),['b','c','a']);
});

test('deleting container deletes descendants; ids become reusable; undo restores entire subtree',async () => {
  const r = new TestRig(); await r.run('init','create g scene','create g inner in scene','create g child in inner'); const before=r.snapshot();
  await r.run('delete scene'); assert.equal(r.session.document.count,0); await r.run('create g child','undo','undo'); assert.equal(r.snapshot(),before);
});

test('display commands preserve history, new edit clears redo, case-sensitive ids',async () => {
  const r = new TestRig(); await r.run('init','create g A','create g a','undo','tree','tree A','show A','canvas','help','redo');
  assert.equal(r.session.document.count,2); await r.run('undo','create g b'); await r.error('redo','nothing to redo');
});

test('successful document commands set barrier; failed resize does not; init resets path',async () => {
  const r = new TestRig(); await r.run('init'); await r.error('undo','undo not allowed after io command'); await r.error('redo','undo not allowed after io command');
  await r.run('create g g','canvas 10 20'); await r.error('undo','undo not allowed after io command');
  await r.run('create g h','undo'); await r.error('canvas 0 20',/positive/); await r.run('redo');
  await r.run('init'); assert.equal(r.session.document.count,0); assert.equal(r.session.path,undefined);
});

test('all command arities are validated',async () => {
  const r = new TestRig(); await r.run('init');
  for (const line of ['init 1 2 3','read','save a b','canvas 1','create','create rect a 1 2','delete','move a 1','scale a','set a fill','group g','ungroup','addto a','front','back a b','tree a b','show','help x','undo x','redo x']) await r.error(line,/^error: usage:/);
  await r.error('unknown','unknown command: unknown');
});

test('mixed edit sequence can undo to baseline and replay exactly',async () => {
  const r = new TestRig(); await r.run('init','create g scene','create rect r 1 2 3 4 in scene','create circle c 3 4 5 in scene');
  const snapshots = [r.snapshot()];
  const choices = ['move scene 0.25 -0.5','scale scene 1.125','set r fill red','front r','back c','group pair c r','ungroup pair','create text t 1 2 "new text" in scene','delete t','addto scene r'];
  for (let i=0;i<80;i++) {
    const out = await r.cli.execute(choices[i % choices.length]!);
    if (!out[0]?.startsWith('error:')) snapshots.push(r.snapshot());
  }
  for (let i=snapshots.length-2;i>=0;i--) { await r.run('undo'); assert.equal(r.snapshot(),snapshots[i]); }
  for (let i=1;i<snapshots.length;i++) { await r.run('redo'); assert.equal(r.snapshot(),snapshots[i]); }
});
