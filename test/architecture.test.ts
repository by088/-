import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, basename, dirname, resolve, relative } from 'node:path';

test('source dependencies follow documented layers and one class per named file',async()=>{
  const files: string[]=[]; const queue=['src'];
  while(queue.length){ const dir=queue.pop()!; for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.isDirectory())queue.push(path);else if(path.endsWith('.ts'))files.push(path);} }
  const allowed: Record<string,string[]>= {domain:['domain'],application:['application','domain'],cli:['cli','application'],infrastructure:['infrastructure','application','domain']};
  for(const path of files){
    const source=await readFile(path,'utf8'); const classes=[...source.matchAll(/export (?:abstract )?class (\w+)/g)];
    assert.ok(classes.length<=1,path); if(classes.length)assert.equal(classes[0]![1]+'.ts',basename(path));
    const layer=path.split('/')[1]!;
    for(const match of source.matchAll(/from ['"]([^'"]+)['"]/g)){
      if(!match[1]!.startsWith('.')){ if(layer==='domain'||layer==='application')assert.fail(`${path} imports external ${match[1]}`);continue; }
      const target=relative(resolve('src'),resolve(dirname(path),match[1]!)).split('/')[0]!;
      if(allowed[layer])assert.ok(allowed[layer]!.includes(target),`${path} -> ${target}`);
    }
    assert.doesNotMatch(source,/switch\s*\(/,path);
  }
});
