const tones=["sage","clay","sand","blue","olive","rose","amber","mint","slate","peach","lilac","plum"];
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const number=value=>{
  const text=String(value??"").replace(/\s/g,"").replace(/[^0-9.,-]/g,"");
  if(/^\d+\.\d{1,2}$/.test(text))return Number(text);
  return Number(text.replace(/\./g,"").replace(",","."));
};
const inferRooms=text=>Number((String(text).match(/\b([1-6])\s*(?:-|\s)?sob/i)||String(text).match(/\b([1-6])s\b/i)||[])[1]||2);
const inferCondition=text=>/novograd|novo|izgradnji/i.test(text)
  ?"novogradnja"
  :/adapt|renoviranj|za urediti/i.test(text)
    ?"za adaptaciju"
    :/renoviran|uređen|uredjen|izvrsno stanje/i.test(text)
      ?"renovirano"
      :"održavano";

function itemListFromHtml(html){
  const pattern=/<script[^>]+type=["']application\/ld(?:\+|&#x2B;)json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for(const match of html.matchAll(pattern)){
    try{
      const block=JSON.parse(match[1]);
      if(block?.["@type"]==="ItemList")return block;
    }catch{}
  }
  return null;
}

function safeListingUrl(value){
  try{
    const url=new URL(value,"https://www.kvadratko.hr");
    if(!/(^|\.)kvadratko\.hr$/i.test(url.hostname))return null;
    if(!/^\/hr\/prodaja\/stan\/o\/\d+\//i.test(url.pathname))return null;
    return url.href;
  }catch{return null;}
}

function safeImageUrl(value){
  try{
    const url=new URL(value);
    return url.hostname.toLowerCase()==="slike.kvadratko.hr"?url.href:null;
  }catch{return null;}
}

export function parseKvadratkoList(html,{now=Date.now()}={}){
  if(/hcaptcha|captcha|pardon our interruption|verify you are human/i.test(html))throw new Error("Kvadratko traži potvrdu preglednika");
  const itemList=itemListFromHtml(html);
  if(!itemList)throw new Error("Kvadratko strukturirani popis nije pronađen");
  const unique=new Map();
  for(const entry of itemList.itemListElement||[]){
    const listing=entry?.item||{};
    const sourceUrl=safeListingUrl(listing.url||entry.url);
    const id=sourceUrl?.match(/\/o\/(\d+)\//i)?.[1];
    const title=listing.name||"Stan u Zagrebu";
    const area=number((title.match(/(\d+(?:[.,]\d+)?)\s*m(?:²|2)/i)||[])[1]);
    const price=number(listing.offers?.price);
    if(!id||!sourceUrl||!area||!price||price/area<800||price/area>15000)continue;
    const neighborhood=listing.address?.addressLocality||"Zagreb";
    const basement=/\bsuteren\b/i.test(title);
    const elevator=/\blift\b|dizalo/i.test(title);
    const parking=/parking|garaž|parkirno/i.test(title);
    unique.set(id,{
      id:`kq-${id}`,
      source:"Kvadratko.hr",
      title,
      neighborhood,
      street:neighborhood,
      area,
      rooms:inferRooms(title),
      price,
      previousPrice:null,
      condition:inferCondition(title),
      floor:0,
      basement,
      elevator,
      parking,
      year:0,
      publishedAt:new Date(now).toISOString(),
      sourceUrl,
      imageUrl:safeImageUrl(listing.image),
      comparables:12,
      microFactor:1,
      imageTone:tones[unique.size%tones.length],
      features:[basement&&"Suteren",elevator&&"Lift",parking&&"Parking",/balkon|lođa|loggia|terasa/i.test(title)&&"Balkon / terasa"].filter(Boolean),
      dateEstimated:true
    });
  }
  return [...unique.values()];
}

export class KvadratkoSource{
  name="Kvadratko.hr";
  url="https://www.kvadratko.hr/hr/prodaja/stan/zagreb";
  lastRun=null;
  constructor({fetchImpl=globalThis.fetch,maxPages=12,delayMs=600,now=()=>Date.now()}={}){
    this.fetchImpl=fetchImpl;
    this.maxPages=maxPages;
    this.delayMs=delayMs;
    this.now=now;
  }
  async fetch(){
    const found=new Map();
    let pagesScanned=0;
    let stoppedReason="max-pages";
    let partial=false;
    for(let page=1;page<=this.maxPages;page++){
      const url=page===1?this.url:`${this.url}?Page=${page}`;
      try{
        const response=await this.fetchImpl(url,{
          headers:{"User-Agent":"Kvadrat/0.5 (+Zagreb real-estate research)","Accept":"text/html,application/xhtml+xml","Accept-Language":"hr-HR,hr;q=0.9"},
          signal:AbortSignal.timeout(20000)
        });
        if(!response.ok)throw new Error(`Kvadratko HTTP ${response.status}`);
        const items=parseKvadratkoList(await response.text(),{now:this.now()});
        pagesScanned=page;
        const before=found.size;
        items.forEach(item=>found.set(item.id,item));
        if(!items.length){stoppedReason="empty-page";break;}
        if(found.size===before){stoppedReason="duplicate-page";break;}
      }catch(error){
        if(!found.size)throw error;
        stoppedReason="error-partial";
        partial=true;
        break;
      }
      if(page<this.maxPages&&this.delayMs)await wait(this.delayMs);
    }
    this.lastRun={pagesScanned,count:found.size,stoppedReason,partial,dateEstimated:true};
    if(!found.size)throw new Error("Kvadratko nije vratio zagrebačke stanove");
    return [...found.values()];
  }
}
