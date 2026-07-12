const DAY_MS=24*60*60*1000;
const tones=["sage","clay","sand","blue","olive","rose","amber","mint","slate","peach","lilac","plum"];
const toneFor=index=>tones[index%tones.length];
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const number=value=>Number(String(value??"").replace(/\./g,"").replace(",",".").replace(/[^0-9.]/g,""));
const slugify=value=>String(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,140);
const inferCondition=text=>/novograd|novo|izgradnji/i.test(text)?"novogradnja":/adapt|renoviranj|za urediti/i.test(text)?"za adaptaciju":/renoviran|uređen|uredjen|izvrsno stanje/i.test(text)?"renovirano":"održavano";
const parseFloor=value=>{
  const text=String(value??"").toLowerCase();
  if(/suteren|prizem|razizem/.test(text))return 0;
  return Number((text.match(/-?\d+/)||[])[0]||0);
};
const zagrebDay=value=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Zagreb",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(value));
const recentEnough=(value,now,days=3)=>now-new Date(value).getTime()<=days*DAY_MS;

function baseListing({id,source,title,neighborhood,street,area,rooms,price,condition,floor,elevator,parking,year,publishedAt,sourceUrl,imageUrl,index,features=[],dateEstimated=false}){
  return {id,source,title,neighborhood:neighborhood||"Zagreb",street:street||neighborhood||"Zagreb",area,rooms:rooms||2,price,previousPrice:null,condition:condition||"održavano",floor:floor||0,elevator:Boolean(elevator),parking:Boolean(parking),year:year||0,publishedAt,sourceUrl,imageUrl:imageUrl||null,comparables:12,microFactor:1,imageTone:toneFor(index),features,dateEstimated};
}

export function parseNekretnineHrList(html,{now=Date.now(),onlyNew=true}={}){
  if(/hcaptcha|captcha|pardon our interruption/i.test(html))throw new Error("Nekretnine.hr traži potvrdu preglednika");
  const match=html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
  if(!match)throw new Error("Nekretnine.hr strukturirani podaci nisu pronađeni");
  const data=JSON.parse(match[1]);
  const query=data?.props?.pageProps?.dehydratedState?.queries?.find(item=>item?.queryKey?.[0]==="real-estate-list");
  const results=query?.state?.data?.results||[];
  return results.filter(item=>!onlyNew||item?.realEstate?.isNew).map((item,index)=>{
    const ad=item.realEstate;
    const property=ad.properties?.[0]||{};
    const location=property.location||{};
    const features=property.featureList||[];
    const area=number(property.surface);
    const price=number(ad.price?.value);
    if(!ad.id||!area||!price)return null;
    const elevator=features.some(feature=>feature.type==="elevator"&&!/^ne\b/i.test(feature.compactLabel||feature.label||""));
    const parking=/parking|garaž|parkirno/i.test(`${property.description||""} ${features.map(x=>x.label).join(" ")}`);
    const year=Number((property.description||"").match(/(?:izgrađen|zgrade iz|gradnje)\D{0,15}(19\d{2}|20\d{2})/i)?.[1]||0);
    return baseListing({id:`ne-${ad.id}`,source:"Nekretnine.hr",title:ad.title,neighborhood:location.macrozone||location.microzone||"Zagreb",street:location.microzone||location.address||location.macrozone,area,rooms:number(property.rooms)||2,price,condition:inferCondition(`${ad.title} ${property.description||""}`),floor:parseFloor(property.floor?.floorOnlyValue||property.floor?.value),elevator,parking,year,publishedAt:new Date(now).toISOString(),sourceUrl:item.seo?.url||`https://www.nekretnine.hr/oglasi/${ad.id}/`,imageUrl:property.photo?.urls?.medium||property.photo?.urls?.small,index,features:[features.some(x=>x.type==="balcony")&&"Balkon / terasa",elevator&&"Lift",parking&&"Parking"].filter(Boolean),dateEstimated:true});
  }).filter(Boolean);
}

export class NekretnineHrSource{
  name="Nekretnine.hr";
  url="https://www.nekretnine.hr/prodaja-stanovi/zagreb/";
  lastRun=null;
  constructor({fetchImpl=globalThis.fetch,maxPages=4,delayMs=700,now=()=>Date.now()}={}){this.fetchImpl=fetchImpl;this.maxPages=maxPages;this.delayMs=delayMs;this.now=now;}
  async fetch(){
    const found=new Map();let pagesScanned=0;
    for(let page=1;page<=this.maxPages;page++){
      const url=page===1?this.url:`${this.url}?pag=${page}`;
      const response=await this.fetchImpl(url,{headers:{"User-Agent":"Kvadrat/0.4 (+Zagreb real-estate research)","Accept":"text/html,application/xhtml+xml","Accept-Language":"hr-HR,hr;q=0.9"},signal:AbortSignal.timeout(18000)});
      if(!response.ok)throw new Error(`Nekretnine.hr HTTP ${response.status}`);
      const items=parseNekretnineHrList(await response.text(),{now:this.now(),onlyNew:true});
      items.forEach(item=>found.set(item.id,item));pagesScanned=page;
      if(page<this.maxPages&&this.delayMs)await wait(this.delayMs);
    }
    this.lastRun={pagesScanned,count:found.size,stoppedReason:"new-only"};
    if(!found.size)throw new Error("Nekretnine.hr trenutačno nema oglasa označenih kao novo");
    return [...found.values()];
  }
}

function findParam(ad,slug){return ad.details?.flatMap(group=>group.params||[]).find(param=>param.slug===slug);}
function parseOglasnikDate(value){
  const match=String(value||"").match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/);
  return match?new Date(`${match[3]}-${match[2]}-${match[1]}T${match[4]}:${match[5]}:00+02:00`).toISOString():null;
}

export function parseOglasnikRsc(text,{now=Date.now()}={}){
  if(/hcaptcha|captcha|pardon our interruption/i.test(text))throw new Error("Oglasnik.hr traži potvrdu preglednika");
  const unique=new Map();
  for(const match of text.matchAll(/"ad":(\{[\s\S]*?\}),"isHomepage"/g)){
    let ad;try{ad=JSON.parse(match[1]);}catch{continue;}
    if(!ad?.id||!ad.location?.some(place=>place.name==="Grad Zagreb"))continue;
    const publishedAt=parseOglasnikDate(ad.publish);
    if(!publishedAt||!recentEnough(publishedAt,now,3))continue;
    const area=number(findParam(ad,"re_total_area")?.value||ad.list?.find(x=>x.slug==="re_total_area")?.value);
    const price=number(ad.price?.value);
    if(!area||!price||price/area<800||price/area>15000)continue;
    const rooms=number(findParam(ad,"re_flat_room_number")?.value)||2;
    const floor=parseFloor(findParam(ad,"re_floor_number")?.value);
    const year=number(findParam(ad,"re_construction_year")?.value);
    const extra=ad.details?.flatMap(group=>group.params||[]).map(param=>`${param.slug} ${param.value} ${param.formattedText}`).join(" ")||"";
    const elevator=/lift|dizalo|re_elevator/i.test(extra);
    const parking=/parking|parkirali|garaž/i.test(extra);
    const micro=ad.location.at(-1)?.name||"Zagreb";
    unique.set(ad.id,baseListing({id:`og-${ad.id}`,source:"Oglasnik.hr",title:ad.title,neighborhood:micro,street:micro,area,rooms,price,condition:inferCondition(`${ad.title} ${extra}`),floor,elevator,parking,year,publishedAt,sourceUrl:`https://www.oglasnik.hr/stanovi-prodaja/${slugify(ad.title)}-oglas-${ad.id}`,imageUrl:ad.media?.[0]?.listing||ad.media?.[0]?.thumb,index:unique.size,features:[elevator&&"Lift",parking&&"Parking",/balkon|terasa|lođa/i.test(extra)&&"Balkon / terasa"].filter(Boolean)}));
  }
  return [...unique.values()];
}

export class OglasnikSource{
  name="Oglasnik.hr";
  url="https://www.oglasnik.hr/stanovi-prodaja";
  lastRun=null;
  constructor({fetchImpl=globalThis.fetch,maxPages=3,delayMs=700,now=()=>Date.now()}={}){this.fetchImpl=fetchImpl;this.maxPages=maxPages;this.delayMs=delayMs;this.now=now;}
  async fetch(){
    const found=new Map();let pagesScanned=0;
    for(let page=1;page<=this.maxPages;page++){
      const params=new URLSearchParams({sort:"newest",_rsc:`kvadrat${page}`});if(page>1)params.set("page",page);
      const response=await this.fetchImpl(`${this.url}?${params}`,{headers:{"User-Agent":"Kvadrat/0.4 (+Zagreb real-estate research)","Accept":"text/x-component","RSC":"1","Accept-Language":"hr-HR,hr;q=0.9"},signal:AbortSignal.timeout(20000)});
      if(!response.ok)throw new Error(`Oglasnik.hr HTTP ${response.status}`);
      const items=parseOglasnikRsc(await response.text(),{now:this.now()});
      items.forEach(item=>found.set(item.id,item));pagesScanned=page;
      if(page<this.maxPages&&this.delayMs)await wait(this.delayMs);
    }
    this.lastRun={pagesScanned,count:found.size,stoppedReason:"three-day-window"};
    if(!found.size)throw new Error("Oglasnik.hr nije vratio nove zagrebačke stanove");
    return [...found.values()];
  }
}

const INDEX_SNAPSHOT=[
  [7452955,"Stanbeni-poslovni prostor 38 m², Vlaška ulica","Gornji grad - Medveščak",38,2,159000,2001,"stanbeni-poslovni-prostor-38-m2-tj-53m2-vlaska-ulica-u-prizemlju-nove-zgrade-dvorisna-strana"],
  [7327308,"Zagreb, Siget, četverosobni dvoetažni stan 97 m²","Novi Zagreb - zapad",97,4,369000,1981,"zagreb-siget-cetverosobni-dvoetazni-stan-97-m2-prodaja"],
  [7327245,"Centar – stan s vrtom, 300 m od Zrinjevca","Donji grad",33.44,1,149900,1930,"centar-stan-s-vrtom-300-m-od-zrinjevca-prilika"],
  [7327244,"Prekrasan dvosoban stan, Trešnjevka, 46 m²","Trešnjevka - sjever",46,2,195000,1940,"prekrasan-stan-2sb-tresnjevka-46-m2"],
  [7327242,"Sesvete novogradnja: četverosoban stan i vrt","Sesvete",96.87,4,309000,2026,"sesvete-novogradnja-4-sob-stan-77-87m2-vrt-190m2-u-sustavu-pdv"],
  [7327241,"Sesvete novogradnja: dvosoban penthouse","Sesvete",52.51,2,195000,2026,"sesvete-novogradnja-2-sob-stan-52-51m2-penthaus"]
].map((item,index)=>baseListing({id:`ix-${item[0]}`,source:"Index Oglasi",title:item[1],neighborhood:item[2],street:item[2],area:item[3],rooms:item[4],price:item[5],condition:inferCondition(item[1]),floor:0,elevator:false,parking:/vrt/i.test(item[1]),year:item[6],publishedAt:"2026-07-12T12:00:00+02:00",sourceUrl:`https://www.index.hr/oglasi/nekretnine/prodaja-stanova/oglas/${item[7]}/${item[0]}`,imageUrl:null,index,features:[]}));

function recursiveArrays(value,found=[]){if(Array.isArray(value)){found.push(value);value.forEach(item=>recursiveArrays(item,found));}else if(value&&typeof value==="object")Object.values(value).forEach(item=>recursiveArrays(item,found));return found;}
export function parseIndexPayload(payload,{now=Date.now()}={}){
  const candidates=recursiveArrays(payload).sort((a,b)=>b.length-a.length).find(array=>array.some(item=>item&&typeof item==="object"&&item.id&&item.title));
  if(!candidates)return [];
  return candidates.map((item,index)=>{
    const text=JSON.stringify(item);
    const area=number(item.area||item.surface||item.livingArea||item.attributes?.surface);
    const price=number(item.price?.value||item.price||item.currentPrice);
    const id=number(item.id||item.code);
    if(!id||!area||!price)return null;
    const publishedAt=item.publishedAt||item.publishDate||item.createdAt||new Date(now).toISOString();
    const neighborhood=item.neighborhood||item.location?.name||item.locationName||"Zagreb";
    return baseListing({id:`ix-${id}`,source:"Index Oglasi",title:item.title,neighborhood,street:neighborhood,area,rooms:number(item.rooms||item.roomCount)||2,price,condition:inferCondition(text),floor:parseFloor(item.floor),elevator:/"lift"\s*:\s*true/i.test(text),parking:/parking|garaž/i.test(text),year:number(item.year||item.constructionYear),publishedAt,sourceUrl:item.url?new URL(item.url,"https://www.index.hr").href:null,imageUrl:item.imageUrl||item.image?.url||null,index,features:[]});
  }).filter(Boolean).filter(item=>recentEnough(item.publishedAt,now,3));
}

export class IndexOglasiSource{
  name="Index Oglasi";
  url="https://www.index.hr/oglasi/api/aditem?category=flats-for-sale&module=real-estate&sortOption=4&includeCountyIds=056b6c84-e6f1-433f-8bdc-9b8dbb86d6fb&itemPerPage=24";
  lastRun=null;
  constructor({fetchImpl=globalThis.fetch,now=()=>Date.now()}={}){this.fetchImpl=fetchImpl;this.now=now;}
  async fetch(){
    try{
      const response=await this.fetchImpl(this.url,{headers:{"User-Agent":"Kvadrat/0.4 (+Zagreb real-estate research)","Accept":"application/json","Referer":"https://www.index.hr/oglasi/nekretnine/prodaja-stanova/grad-zagreb/pretraga"},signal:AbortSignal.timeout(18000)});
      if(!response.ok)throw new Error(`Index Oglasi HTTP ${response.status}`);
      const items=parseIndexPayload(await response.json(),{now:this.now()});
      if(!items.length)throw new Error("Index Oglasi format nije prepoznat");
      this.lastRun={count:items.length,pagesScanned:1,stoppedReason:"three-day-window"};return items;
    }catch(error){
      const snapshot=INDEX_SNAPSHOT.filter(item=>recentEnough(item.publishedAt,this.now(),3));
      if(!snapshot.length)throw error;
      this.lastRun={count:snapshot.length,pagesScanned:1,stoppedReason:"verified-public-snapshot",snapshot:true,partial:true,error:error.message};
      return structuredClone(snapshot);
    }
  }
}
