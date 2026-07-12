let apiAvailable;
let staticDataPromise;

const baseUrl=()=>globalThis.document?.baseURI||import.meta.url;

async function readStaticData(){
  staticDataPromise??=fetch(new URL("data.json",baseUrl()),{cache:"no-store"}).then(response=>{
    if(!response.ok)throw new Error(`data.json HTTP ${response.status}`);
    return response.json();
  });
  return staticDataPromise;
}

async function readApi(path,params){
  if(apiAvailable===false)return null;
  try{
    const url=new URL(path,baseUrl());
    if(params)url.search=params.toString();
    const response=await fetch(url,{cache:"no-store"});
    if(!response.ok||!response.headers.get("content-type")?.includes("application/json"))throw new Error(`API HTTP ${response.status}`);
    apiAvailable=true;
    return await response.json();
  }catch{
    apiAvailable=false;
    return null;
  }
}

function rotateBySource(items){
  const groups=new Map();
  for(const item of items){if(!groups.has(item.source))groups.set(item.source,[]);groups.get(item.source).push(item);}
  const result=[];let added=true;
  while(added){added=false;for(const group of groups.values()){const item=group.shift();if(item){result.push(item);added=true;}}}
  return result;
}

export function staticListingsPayload(data,params=new URLSearchParams()){
  const area=params.get("area")||"all";
  const source=params.get("source")||"all";
  const minDeal=Number(params.get("minDeal")||-100);
  const maxPrice=Number(params.get("maxPrice")||Infinity);
  const query=(params.get("q")||"").toLocaleLowerCase("hr");
  const sort=params.get("sort")||"newest";
  const all=data.listings||[];
  const items=all.filter(item=>(area==="all"||item.neighborhood===area)&&(source==="all"||item.source===source)&&item.discountPct>=minDeal&&item.price<=maxPrice&&(!query||`${item.title} ${item.neighborhood} ${item.street}`.toLocaleLowerCase("hr").includes(query))).sort((a,b)=>sort==="deal"?b.discountPct-a.discountPct:sort==="price"?a.price-b.price:new Date(b.publishedAt)-new Date(a.publishedAt));
  const displayed=sort==="newest"&&source==="all"?rotateBySource(items):items;
  return {items:displayed,total:all.length,sources:[...new Set(all.map(item=>item.source))].sort(),lastSync:data.lastSync,sourceStatus:data.sourceStatus||[],usingDemo:Boolean(data.usingDemo),usingCached:Boolean(data.usingCached),usingSnapshot:Boolean(data.usingSnapshot),staticMode:true};
}

export function staticStatsPayload(data,now=Date.now()){
  const listings=data.listings||[];
  return {total:listings.length,goodDeals:listings.filter(item=>item.discountPct>=8).length,averageM2:listings.length?Math.round(listings.reduce((sum,item)=>sum+item.priceM2,0)/listings.length):0,newToday:listings.filter(item=>now-new Date(item.firstSeenAt||item.publishedAt)<86400000).length,lastSync:data.lastSync};
}

export async function getListings(params=new URLSearchParams()){
  return await readApi("api/listings",params)||staticListingsPayload(await readStaticData(),params);
}

export async function getStats(){
  return await readApi("api/stats")||staticStatsPayload(await readStaticData());
}
