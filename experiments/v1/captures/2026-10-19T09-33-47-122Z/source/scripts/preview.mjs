import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { onRequest } from '../functions/api/subscribe.js';
const root = resolve('public');
const port = Number(process.env.PREVIEW_PORT || 8788);
const origin = 'http://127.0.0.1:' + port;
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.webp':'image/webp', '.woff2':'font/woff2', '.json':'application/json' };
createServer(async (req,res) => {
  try {
    const url = new URL(req.url, origin);
    if (url.pathname === '/api/subscribe') {
      const body = req.method === 'POST' ? req : undefined;
      const request = new Request(url, {method:req.method,headers:req.headers,body,duplex:'half'});
      const result = await onRequest({request,env:{...process.env,SITE_ORIGIN:origin}});
      res.writeHead(result.status,Object.fromEntries(result.headers));res.end(await result.text());return;
    }
    const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!path.startsWith(root + '/')) {res.writeHead(403);res.end();return;}
    const data = await readFile(path);
    res.writeHead(200,{'Content-Type':mime[extname(path)] || 'application/octet-stream','Cache-Control':'no-store'});res.end(data);
  } catch {res.writeHead(404);res.end('No encontrado');}
}).listen(port,'127.0.0.1',()=>console.log('Vista previa: ' + origin + ' (GA desactivado en local)'));
