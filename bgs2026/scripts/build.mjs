import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {findsPages,guideLibrary,findsFooter} from '../src/lib/finds-pages.mjs';
import {availableCatalog} from '../src/lib/finds-catalog.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'dist');
let base='';const arg=process.argv.indexOf('--base');if(arg>=0)base=process.argv[arg+1]||'';
if(base&&!/^\/(?:[A-Za-z0-9._-]+\/)*$/.test(base))throw Error('--base must be an absolute URL path ending in /, for example /bgs2026/dist/.');
base=base==='/'?'':base.replace(/\/$/,'');
const live='https://brutal-game-studios-neon.brutalmotorworks.chatgpt.site';
const prefix=value=>base+value;
async function write(relative,value){const target=path.resolve(out,relative);if(!target.startsWith(path.resolve(out)+path.sep))throw Error('Invalid generated path');await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,value);}
function transform(html){
 html=html.replace(/href="\/(apps\/|web-design\/|)(?:#.*?)?"/g,(match,rest)=>`href="${live}/${rest}"`);
 html=html.replace(/(href|src)="\/(?!\/)([^"#]*)/g,(_,attr,rest)=>`${attr}="${prefix('/'+rest)}`);
 const banner=`<aside class="preview-banner">LOCAL PREVIEW — snapshot, not the live store. <a href="${live}/finds/">Open live BGS2026 Finds ↗</a> <a href="${prefix('/help/USER_GUIDE.html')}">User guide</a></aside>`;
 return html.replace('</head>','<meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="'+prefix('/preview.css')+'"></head>').replace('<body>','<body>'+banner);
}
const hub=(await fs.readFile(path.join(root,'src/storefront/finds.html'),'utf8')).replace('<!-- GUIDE_LIBRARY -->',guideLibrary()).replace(/<footer class="wrap">[\s\S]*?<\/footer>/,findsFooter);
const pages={'/finds/':hub,...findsPages};
for(const [route,html]of Object.entries(pages))await write(route.slice(1)+'index.html',transform(html));
for(const name of ['finds.css','finds-guides.css','finds.js','finds-catalog.js']){
 let contents=await fs.readFile(path.join(root,'src/public',name),'utf8');
 if(name==='finds-catalog.js')contents=contents.replace("fetch('/api/finds-catalog',","fetch('"+prefix('/api/finds-catalog.json')+"',");
 await write(name,contents);
}
const catalog=JSON.parse(await fs.readFile(path.join(root,'src/catalog/finds.json'),'utf8'));
await write('api/finds-catalog.json',JSON.stringify({items:availableCatalog(catalog).map(item=>({...item,image:{...item.image,url:item.image.url.startsWith('/')?prefix(item.image.url):item.image.url}}))}));
await write('preview.css','.preview-banner{background:#dfef83;color:#130a20;padding:12px 20px;font:600 13px/1.6 system-ui,sans-serif}.preview-banner a{color:#130a20;display:inline-block;margin-left:15px;text-underline-offset:3px}.preview-banner a:focus-visible{outline:3px solid #502485;outline-offset:3px}');
await write('index.html',`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>BGS2026 Finds preview</title><meta http-equiv="refresh" content="0;url=${prefix('/finds/')}"><p><a href="${prefix('/finds/')}">Open BGS2026 Finds preview</a></p></html>`);
await write('robots.txt','User-agent: *\nDisallow: /\n');
const help=path.join(root,'docs');
async function copyHelp(dir,relative=''){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const next=path.join(dir,entry.name),rel=path.posix.join(relative,entry.name);if(entry.isDirectory())await copyHelp(next,rel);else if(/\.(?:html|png|md|txt|css|json)$/.test(entry.name))await write('help/'+rel,await fs.readFile(next));}}
await copyHelp(help);
for(const name of ['THIRD_PARTY_NOTICES.html']){try{await write(name,(await fs.readFile(path.join(root,name),'utf8')).replaceAll('href="docs/','href="help/'));}catch(error){if(error.code!=='ENOENT')throw error;}}
await write('manifest.json',JSON.stringify({name:'BGS2026 Finds local preview',version:'1.0.0',liveUrl:live+'/finds/',basePath:base,guideCount:6,photoCatalogProducts:availableCatalog(catalog).length,localPreview:true},null,2));
console.log('Built portable Finds snapshot in '+out+' (base '+(base||'/')+').');
