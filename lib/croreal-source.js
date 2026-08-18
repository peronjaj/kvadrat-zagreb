const tones=["sage","clay","sand","blue","olive","rose","amber","mint","slate","peach","lilac","plum"];
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const number=value=>Number(String(value??"").replace(/\./g,"").replace(",",".").replace(/[^0-9.]/g,""));

const inferCondition=text=>/novograd|novo|izgradnji/i.test(text)
  ?"novogradnja"
  :/adapt|renoviranj|za urediti/i.test(text)
    ?"za adaptaciju"
    :/renoviran|uređen|uredjen|izvrsno stanje/i.test(text)
      ?"renovirano"
      :"održavano";

function jsonLdBlocks(html){
  const blocks=[];
  for(const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
    try{blocks.push(JSON.parse(match[1]));}catch{}
  }
  return blocks;
}

function safeListingUrl(value){
  try{
    const url=new URL(value,"https://www.croreal.com");
    if(!/(^|\.)croreal\.com$/i.test(url.hostname))return null;
    if(!/^\/hr\/stan-na-prodaju\/grad-zagreb\//i.test(url.pathname))return null;
    return url.href;
  }catch{return null;}
}

function safeImageUrl(value){
  try{
    const url=new URL(value);
    return url.hostname.toLowerCase()==="img.croreal.com"?url.href:null;
  }catch{return null;}
}

export function parseCroRealList(html,{now=Date.now()}={}){
  if(/hcaptcha|captcha|pardon our interruption|verify you are human/i.test(html))throw new Error("CroReal traži potvrdu preglednika");
  const itemList=jsonLdBlocks(html).find(block=>block?.["@type"]==="ItemList");
  if(!itemList)throw new Error("CroReal strukturirani popis nije pronađen");
  const unique=new Map();
  for(const entry of itemList.itemListElement||[]){
    const listing=entry?.item||{};
    const offer=listing.offers||{};
    const property=offer.itemOffered||{};
    const sourceUrl=safeListingUrl(listing.url||offer.url);
    const id=sourceUrl?.match(/\/hr-(\d+)(?:[/?#]|$)/i)?.[1];
    const area=number(property.floorSize?.value);
    const price=number(offer.price);
    if(!id||!sourceUrl||!area||!price||price/area<800||price/area>15000)continue;
    const title=listing.name||property.name||"Stan u Zagrebu";
    const neighborhood=property.address?.addressLocality||"Zagreb";
    const images=Array.isArray(listing.image)?listing.image:[listing.image];
    unique.set(id,{
      id:`cr-${id}`,
      source:"CroReal.com",
      title,
      neighborhood,
      street:neighborhood,
      area,
      rooms:number(property.numberOfRooms)||2,
      price,
      previousPrice:null,
      condition:inferCondition(title),
      floor:0,
      basement:false,
      elevator:false,
      parking:false,
      year:0,
      publishedAt:new Date(now).toISOString(),
      sourceUrl,
      imageUrl:safeImageUrl(images.find(Boolean)),
      comparables:12,
      microFactor:1,
      imageTone:tones[unique.size%tones.length],
      features:[],
      dateEstimated:true
    });
  }
  return [...unique.values()];
}

export class CroRealSource{
  name="CroReal.com";
  url="https://www.croreal.com/hr/nekretnine-zagreb/prodaja/stanovi";
  lastRun=null;
  constructor({fetchImpl=globalThis.fetch,maxPages=20,delayMs=600,now=()=>Date.now()}={}){
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
      const params=new URLSearchParams({sort:"date-asc"});
      if(page>1)params.set("page",page);
      try{
        const response=await this.fetchImpl(`${this.url}?${params}`,{
          headers:{"User-Agent":"Kvadrat/0.5 (+Zagreb real-estate research)","Accept":"text/html,application/xhtml+xml","Accept-Language":"hr-HR,hr;q=0.9"},
          signal:AbortSignal.timeout(18000)
        });
        if(!response.ok)throw new Error(`CroReal HTTP ${response.status}`);
        const items=parseCroRealList(await response.text(),{now:this.now()});
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
    if(!found.size)throw new Error("CroReal nije vratio zagrebačke stanove");
    return [...found.values()];
  }
}
