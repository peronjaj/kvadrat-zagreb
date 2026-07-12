import { deduplicate,estimateListing,normalizeNeighborhood } from "./deal-engine.js";
import { demoSource,liveSources } from "./sources.js";
import { snapshotSource } from "./njuskalo-snapshot.js";
import { loadData as loadLocalData,saveData as saveLocalData } from "./store.js";
import { mergeAndRetain } from "./retention.js";

const zagrebDay=value=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Zagreb",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(value));

export async function syncListings({
  loadData=loadLocalData,
  saveData=saveLocalData,
  sources=liveSources,
  now=Date.now()
}={}){
  const previous=await loadData();
  const sourceStatus=[];
  const batches=[];
  for(const source of sources){
    try{
      const items=await source.fetch();
      batches.push(items);
      sourceStatus.push({source:source.name,ok:true,count:items.length,...(source.lastRun||{})});
    }catch(error){
      console.warn(`${source.name}: ${error.message}`);
      sourceStatus.push({source:source.name,ok:false,count:0,error:error.message});
    }
  }

  const fetchedLive=batches.flat();
  let usingCached=sourceStatus.some(status=>!status.ok);
  let usingSnapshot=sourceStatus.some(status=>status.snapshot);
  let usingDemo=false;
  const njuskaloStatus=sourceStatus.find(status=>status.source==="Njuškalo"||status.source==="njuskalo");
  if(!njuskaloStatus?.ok||njuskaloStatus?.partial){
    const snapshot=await snapshotSource.fetch();
    const today=zagrebDay(now);
    const todaysSnapshot=snapshot.filter(item=>zagrebDay(item.publishedAt)===today);
    if(todaysSnapshot.length){
      fetchedLive.push(...todaysSnapshot.map(item=>({...item,snapshot:false,snapshotSupplement:true})));
      usingSnapshot=true;
    }
  }

  let listings;
  if(fetchedLive.length){
    const normalized=deduplicate(fetchedLive.map(item=>({...item,neighborhood:normalizeNeighborhood(item.neighborhood)}))).map(estimateListing);
    const previousLive=(previous.listings||[]).filter(item=>!item.source?.includes("demo")&&!item.snapshot);
    listings=mergeAndRetain(previousLive,normalized,now);
  }else{
    const cachedLive=(previous.listings||[]).filter(item=>!item.source?.includes("demo")&&!item.snapshot);
    const retainedCache=mergeAndRetain(cachedLive,[],now);
    if(retainedCache.length){
      listings=retainedCache;
      usingCached=true;
      const snapshot=await snapshotSource.fetch();
      const today=zagrebDay(now);
      const todaysSnapshot=snapshot.filter(item=>zagrebDay(item.publishedAt)===today).map(item=>estimateListing({...item,snapshot:false,snapshotSupplement:true,neighborhood:normalizeNeighborhood(item.neighborhood)}));
      if(todaysSnapshot.length){listings=mergeAndRetain(retainedCache,todaysSnapshot,now);usingSnapshot=true;}
    }else{
      const snapshot=await snapshotSource.fetch();
      if(snapshot.length){
        listings=snapshot.map(item=>estimateListing({...item,neighborhood:normalizeNeighborhood(item.neighborhood),firstSeenAt:item.publishedAt,lastSeenAt:item.publishedAt}));
        usingSnapshot=true;
      }else{
        listings=(await demoSource.fetch()).map(estimateListing);
        usingDemo=true;
      }
    }
  }

  listings=listings.map(estimateListing);
  listings.sort((a,b)=>new Date(b.firstSeenAt||b.publishedAt)-new Date(a.firstSeenAt||a.publishedAt));
  const data={listings,lastSync:new Date(now).toISOString(),sourceStatus,usingDemo,usingCached,usingSnapshot};
  await saveData(data);
  return data;
}
