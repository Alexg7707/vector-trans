import http from 'node:http';
import {readFile} from 'node:fs/promises';
import handler from './api/request.js';
const files={'/':'index.html','/style.css':'style.css','/app.js':'app.js'};
http.createServer(async(req,res)=>{
  if(req.url === '/api/request') {
    let body='';
    for await(const chunk of req) { body+=chunk; if(body.length>10000){res.writeHead(413);res.end();return;} }
    req.body=body;
    res.status = code => {res.statusCode=code;return res;};
    res.json = data => {res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(data));};
    return handler(req,res);
  }
  const file=files[req.url?.split('?')[0]];
  if(!file){res.writeHead(404);res.end('Not found');return;}
  res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html; charset=utf-8');
  res.end(await readFile(new URL('./'+file,import.meta.url)));
}).listen(3000,'127.0.0.1',()=>console.log('Local preview: http://127.0.0.1:3000'));

