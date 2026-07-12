import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root=path.resolve("public");
const port=Number(process.env.PORT||4175);
const types={".html":"text/html",".css":"text/css",".js":"text/javascript",".json":"application/json"};
http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,`http://${req.headers.host}`);
    const relative=url.pathname==="/"?"index.html":url.pathname.slice(1);
    const file=path.resolve(root,relative);
    if(!file.startsWith(root))throw Object.assign(new Error("Forbidden"),{code:"EACCES"});
    const body=await readFile(file);
    res.writeHead(200,{"Content-Type":`${types[path.extname(file)]||"application/octet-stream"}; charset=utf-8`});
    res.end(body);
  }catch(error){res.writeHead(error.code==="EACCES"?403:404);res.end("Not found");}
}).listen(port,()=>console.log(`Statički pregled: http://localhost:${port}`));
