import http from 'node:http';
const {default:app}=await import('../worker/index.js');
http.createServer(async(req,res)=>{try{const r=await app.fetch(new Request('http://localhost'+req.url,{method:req.method}),{}, {waitUntil:p=>p.catch(()=>{})});res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));}catch(e){res.writeHead(500);res.end(e.message);}}).listen(Number(process.argv[process.argv.indexOf('--port')+1])||Number(process.env.PORT)||3000,'0.0.0.0');
