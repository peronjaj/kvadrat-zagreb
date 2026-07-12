import { mkdir,readFile,writeFile } from "node:fs/promises";
import path from "node:path";

const root=process.cwd();
const source=path.join(root,"work","data.json");
const destination=path.join(root,"public","data.json");
let data={listings:[],lastSync:null,sourceStatus:[],usingDemo:false,usingCached:false,usingSnapshot:false};
try{data=JSON.parse(await readFile(source,"utf8"));}
catch{
  try{data=JSON.parse(await readFile(destination,"utf8"));}
  catch{console.warn("Početni cache nije pronađen; Netlify će krenuti s praznim popisom.");}
}
await mkdir(path.dirname(destination),{recursive:true});
await writeFile(destination,JSON.stringify(data),"utf8");
console.log(`Netlify paket pripremljen: ${data.listings?.length||0} početnih oglasa.`);
