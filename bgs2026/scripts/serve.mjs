import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const portArg=process.argv.indexOf('--port'),port=portArg>=0?Number(process.argv[portArg+1]):4175;
if(!Number.isInteger(port)||port<0||port>65535)throw Error('Invalid port');
const types={'.html':'text/html; charset=utf-8','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png'};
export const server=http.createServer(async(req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
 try{const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);const relative=pathname.endsWith('/')?pathname+'index.html':pathname;const file=path.resolve(root,'.'+relative);if(!file.startsWith(root+path.sep))throw Error('Outside preview');const bytes=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':bytes.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow'});res.end(req.method==='HEAD'?undefined:bytes);}catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log('Local preview: http://127.0.0.1:'+server.address().port+'/finds/ (Ctrl+C stops it)'));
