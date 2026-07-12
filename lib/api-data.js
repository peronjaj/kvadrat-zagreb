export function filterListings(listings,params){
  const area=params.get("area")||"all";
  const source=params.get("source")||"all";
  const minDeal=Number(params.get("minDeal")||-100);
  const maxPrice=Number(params.get("maxPrice")||Infinity);
  const query=(params.get("q")||"").toLocaleLowerCase("hr");
  const sort=params.get("sort")||"newest";
  const filtered=listings.filter(item=>(area==="all"||item.neighborhood===area)&&(source==="all"||item.source===source)&&item.discountPct>=minDeal&&item.price<=maxPrice&&(!query||`${item.title} ${item.neighborhood} ${item.street}`.toLocaleLowerCase("hr").includes(query)));
  const sorted=filtered.sort((a,b)=>sort==="deal"?b.discountPct-a.discountPct:sort==="price"?a.price-b.price:new Date(b.publishedAt)-new Date(a.publishedAt));
  if(sort!=="newest"||source!=="all")return sorted;
  const groups=new Map();
  for(const item of sorted){if(!groups.has(item.source))groups.set(item.source,[]);groups.get(item.source).push(item);}
  const rotated=[];let added=true;
  while(added){added=false;for(const group of groups.values()){const item=group.shift();if(item){rotated.push(item);added=true;}}}
  return rotated;
}

export function listingsPayload(data,params){
  const listings=data.listings||[];
  return {items:filterListings([...listings],params),total:listings.length,sources:[...new Set(listings.map(item=>item.source))].sort(),lastSync:data.lastSync,sourceStatus:data.sourceStatus||[],usingDemo:Boolean(data.usingDemo),usingCached:Boolean(data.usingCached),usingSnapshot:Boolean(data.usingSnapshot)};
}

export function statsPayload(data,now=Date.now()){
  const listings=data.listings||[];
  const deals=listings.filter(item=>item.discountPct>=8);
  const averageM2=listings.length?Math.round(listings.reduce((sum,item)=>sum+item.priceM2,0)/listings.length):0;
  return {total:listings.length,goodDeals:deals.length,averageM2,newToday:listings.filter(item=>now-new Date(item.firstSeenAt||item.publishedAt)<86400000).length,lastSync:data.lastSync};
}
