import http from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import path from 'node:path';
const args=process.argv.slice(2);const value=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const host=value('--host','127.0.0.1'),port=Number(value('--port','4173')),root=process.cwd();
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.obj':'text/plain','.map':'text/plain'};
http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathname.split('/').some(part=>part.startsWith('.'))){res.writeHead(403);res.end('Forbidden');return;}let file=path.resolve(root,'.'+pathname);if(file!==root&&!file.startsWith(root+path.sep))throw Error();let info=await stat(file);if(info.isDirectory()){file=path.join(file,'index.html');info=await stat(file);}if(!info.isFile())throw Error();res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});createReadStream(file).pipe(res);}catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}}).listen(port,host,()=>console.log(`Brushkeep local server: http://${host}:${port}/`));
