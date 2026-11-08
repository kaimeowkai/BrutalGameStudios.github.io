import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath}from'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));const files=[];
async function walk(dir,rel=''){for(const ent of await fs.readdir(dir,{withFileTypes:true})){const full=path.join(dir,ent.name),name=path.posix.join(rel,ent.name);if(ent.isDirectory())await walk(full,name);else files.push({name:'/'+name,bytes:await fs.readFile(full)});}}
await walk(path.join(root,'dist'));files.sort((a,b)=>a.name.localeCompare(b.name));
const int=n=>{const b=Buffer.alloc(4);b.writeInt32LE(n);return b;};
const chunks=[Buffer.from('BGSFIND1'),int(files.length)];
for(const f of files){const name=Buffer.from(f.name);chunks.push(int(name.length),name,int(f.bytes.length),f.bytes);}
await fs.mkdir(path.join(root,'.windows-build'),{recursive:true});await fs.writeFile(path.join(root,'.windows-build/site.bin'),Buffer.concat(chunks));console.log('Bundled '+files.length+' first-party preview files.');
