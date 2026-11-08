import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath}from'node:url';import {spawn}from'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url)),dist=path.join(root,'dist');
const files=[];async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const full=path.join(dir,e.name);if(e.isDirectory())await walk(full);else files.push(full);}}
test('every generated HTML link, image, script and local fragment resolves',async()=>{
 await walk(dist);let checked=0;
 for(const file of files.filter(x=>x.endsWith('.html'))){const html=await fs.readFile(file,'utf8');assert.equal((html.match(/<h1[ >]/g)||[]).length,file.endsWith(path.join('dist','index.html'))?0:1,file+' heading');
  for(const match of html.matchAll(/(?:href|src)="([^\"]+)"/g)){const href=match[1].replaceAll('&amp;','&');if(/^(?:https?:|mailto:|data:)/.test(href))continue;let target=href.split('#')[0].split('?')[0];const fragment=href.includes('#')?href.split('#')[1]:'';const resolved=target?path.resolve(target.startsWith('/')?dist:path.dirname(file),target.startsWith('/')?'.'+target:target):file;let info=await fs.stat(resolved);const final=info.isDirectory()?path.join(resolved,'index.html'):resolved;assert.ok((await fs.stat(final)).isFile(),file+' -> '+href);if(fragment&&final.endsWith('.html')){const text=final===file?html:await fs.readFile(final,'utf8');assert.ok(text.includes('id="'+fragment+'"'),file+' missing fragment '+href);}checked++;}
 }
 assert.ok(checked>200,'expected a meaningful link/asset sample');
});
test('actual Node preview serves content and refuses writes and missing resources',async(t)=>{
 const child=spawn(process.execPath,['scripts/serve.mjs','--port','0'],{cwd:root,stdio:['ignore','pipe','pipe']});t.after(()=>child.kill());
 const url=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Preview start timed out')),10000);child.once('error',reject);child.stdout.on('data',bytes=>{const m=/http:\/\/127\.0\.0\.1:(\d+)/.exec(bytes.toString());if(m){clearTimeout(timer);resolve('http://127.0.0.1:'+m[1]);}});child.stderr.on('data',bytes=>reject(Error(bytes.toString())));});
 const hub=await fetch(url+'/finds/');assert.equal(hub.status,200);const html=await hub.text();assert.ok(html.includes('LOCAL PREVIEW'));assert.equal((html.match(/class="guide-card"/g)||[]).length,6);assert.ok(html.includes('tag=brutalgamestu-20'));
 const head=await fetch(url+'/finds/',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
 assert.equal((await fetch(url+'/finds/',{method:'POST'})).status,405);assert.equal((await fetch(url+'/not-present')).status,404);
 assert.deepEqual(await(await fetch(url+'/api/finds-catalog.json')).json(),{items:[]});
 const guide=await fetch(url+'/help/USER_GUIDE.html');assert.equal(guide.status,200);assert.ok((await guide.text()).includes('images/08-windows-preview.png'));
 assert.equal((await fetch(url+'/help/images/08-windows-preview.png')).headers.get('content-type'),'image/png');
});
