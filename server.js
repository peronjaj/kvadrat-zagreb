import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadData, saveData } from "./lib/store.js";
import { syncListings } from "./lib/sync-service.js";
import { listingsPayload,statsPayload } from "./lib/api-data.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, "public");
const port = Number(process.env.PORT || 4173);

function json(res, value, status = 200) {
  res.writeHead(status, { "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store" });
  res.end(JSON.stringify(value));
}

async function api(req, res, url) {
  if (url.pathname === "/api/health") return json(res, { ok:true });
  if (url.pathname === "/api/sync" && req.method === "POST") return json(res, await syncListings({loadData,saveData}));
  const data = await loadData();
  if (url.pathname === "/api/listings") return json(res,listingsPayload(data,url.searchParams));
  if (url.pathname === "/api/stats") return json(res,statsPayload(data));
  const match = url.pathname.match(/^\/api\/listings\/([^/]+)$/);
  if (match) {
    const item = data.listings.find(x => x.id === match[1]);
    return item ? json(res, item) : json(res, { error:"Oglas nije pronađen" }, 404);
  }
  return false;
}

const types = { ".html":"text/html", ".css":"text/css", ".js":"text/javascript", ".svg":"image/svg+xml", ".json":"application/json" };
const server = http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      const handled = await api(req,res,url);
      if (handled === false) json(res, { error:"Ruta nije pronađena" }, 404);
      return;
    }
    const relative = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const filePath = path.resolve(publicDir, relative);
    if (!filePath.startsWith(publicDir)) { res.writeHead(403); res.end(); return; }
    const body = await readFile(filePath);
    res.writeHead(200, { "Content-Type":`${types[path.extname(filePath)] || "application/octet-stream"}; charset=utf-8` });
    res.end(body);
  } catch (error) {
    if (error.code === "ENOENT") { res.writeHead(404); res.end("Not found"); }
    else { console.error(error); json(res, { error:"Interna pogreška" }, 500); }
  }
});

await syncListings({loadData,saveData});
function scheduleDailySync(){
  const now=new Date();
  const next=new Date(now);
  next.setHours(9,0,0,0);
  if(next<=now)next.setDate(next.getDate()+1);
  const timer=setTimeout(async()=>{try{await syncListings({loadData,saveData});}catch(error){console.error(error);}scheduleDailySync();},next-now);
  timer.unref();
}
scheduleDailySync();
server.listen(port, () => console.log(`Kvadrat je dostupan na http://localhost:${port}`));
