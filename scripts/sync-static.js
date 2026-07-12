import { readFile,writeFile } from "node:fs/promises";
import path from "node:path";
import { syncListings } from "../lib/sync-service.js";

const dataPath=path.join(process.cwd(),"public","data.json");
const empty={listings:[],lastSync:null,sourceStatus:[],usingDemo:false,usingCached:false,usingSnapshot:false};
const loadData=async()=>{try{return JSON.parse(await readFile(dataPath,"utf8"));}catch{return structuredClone(empty);}};
const saveData=async data=>writeFile(dataPath,JSON.stringify(data),"utf8");

const data=await syncListings({loadData,saveData});
console.log(`GitHub Pages podaci osvježeni: ${data.listings.length} oglasa.`);
for(const status of data.sourceStatus)console.log(`${status.source}: ${status.ok?status.count:"nedostupno"}${status.snapshot?" (snimka)":""}`);
