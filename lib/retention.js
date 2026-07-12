export const DAY_MS=24*60*60*1000;
export const STANDARD_RETENTION_MS=3*DAY_MS;
export const BELOW_MARKET_RETENTION_MS=7*DAY_MS;

const timestamp=item=>new Date(item.lastSeenAt||item.firstSeenAt||item.publishedAt||0).getTime();

export function mergeAndRetain(previousListings,currentListings,now=Date.now()){
  const nowIso=new Date(now).toISOString();
  const previousById=new Map(previousListings.map(item=>[item.id,item]));
  const currentIds=new Set(currentListings.map(item=>item.id));

  const refreshed=currentListings.map(item=>{
    const previous=previousById.get(item.id);
    const firstSeenAt=previous?.firstSeenAt||item.firstSeenAt||nowIso;
    const priceHistory=[...(previous?.priceHistory||[])];
    if(previous&&previous.price!==item.price){
      priceHistory.push({price:previous.price,at:previous.lastSeenAt||nowIso});
    }
    const publishedAt=previous&&item.dateEstimated?previous.publishedAt:item.publishedAt;
    return {...previous,...item,publishedAt,firstSeenAt,lastSeenAt:nowIso,priceHistory:priceHistory.slice(-30)};
  });

  const retained=previousListings.filter(item=>{
    if(currentIds.has(item.id))return false;
    const retention=item.discountPct>0?BELOW_MARKET_RETENTION_MS:STANDARD_RETENTION_MS;
    return now-timestamp(item)<=retention;
  }).map(item=>({...item,firstSeenAt:item.firstSeenAt||item.publishedAt||nowIso,lastSeenAt:item.lastSeenAt||item.publishedAt||nowIso,priceHistory:item.priceHistory||[]}));

  return [...refreshed,...retained].sort((a,b)=>new Date(b.firstSeenAt||b.publishedAt)-new Date(a.firstSeenAt||a.publishedAt));
}
