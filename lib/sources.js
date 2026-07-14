const now = Date.now();
const hoursAgo = (hours) => new Date(now - hours * 3600000).toISOString();

const DEMO_LISTINGS = [
  { id:"kv-101", source:"Oglasnik demo", title:"Svijetao trosoban stan uz park", neighborhood:"Maksimir", street:"Bukovačka cesta", area:72, rooms:3, price:219000, previousPrice:239000, condition:"renovirano", floor:2, elevator:true, parking:true, year:1987, publishedAt:hoursAgo(1), comparables:14, microFactor:1.01, imageTone:"sage", features:["Balkon","Garaža","Park 3 min"] },
  { id:"kv-102", source:"Nekretnine demo", title:"Dvosoban stan s velikom lođom", neighborhood:"Trešnjevka", street:"Selska cesta", area:54, rooms:2, price:155000, previousPrice:164000, condition:"održavano", floor:4, elevator:true, parking:false, year:1978, publishedAt:hoursAgo(2.4), comparables:18, microFactor:.99, imageTone:"clay", features:["Lođa","Lift","Tramvaj"] },
  { id:"kv-103", source:"Agencija demo", title:"Stan za adaptaciju u centru", neighborhood:"Donji grad", street:"Boškovićeva ulica", area:81, rooms:3, price:238000, previousPrice:null, condition:"za adaptaciju", floor:3, elevator:false, parking:false, year:1912, publishedAt:hoursAgo(4), comparables:11, microFactor:1.08, imageTone:"sand", features:["Centar","Visoki stropovi","Dvorište"] },
  { id:"kv-104", source:"Oglasnik demo", title:"Novogradnja blizu Bundeka", neighborhood:"Novi Zagreb", street:"Središće", area:68, rooms:3, price:246000, previousPrice:null, condition:"novogradnja", floor:5, elevator:true, parking:true, year:2025, publishedAt:hoursAgo(5), comparables:9, microFactor:1.07, imageTone:"blue", features:["Novogradnja","Garaža","A+ certifikat"] },
  { id:"kv-105", source:"Nekretnine demo", title:"Obiteljski četverosoban stan", neighborhood:"Črnomerec", street:"Kustošijanska ulica", area:96, rooms:4, price:269000, previousPrice:285000, condition:"održavano", floor:1, elevator:false, parking:true, year:1996, publishedAt:hoursAgo(7), comparables:12, microFactor:.96, imageTone:"olive", features:["Vrt","Parking","Spremište"] },
  { id:"kv-106", source:"Agencija demo", title:"Kompaktan stan za najam ili život", neighborhood:"Trnje", street:"Vukovarska ulica", area:39, rooms:2, price:139000, previousPrice:null, condition:"renovirano", floor:6, elevator:true, parking:false, year:1968, publishedAt:hoursAgo(9), comparables:20, microFactor:1.02, imageTone:"rose", features:["Lift","Pogled","Namješten"] },
  { id:"kv-107", source:"Oglasnik demo", title:"Trosoban stan u mirnoj ulici", neighborhood:"Dubrava", street:"Čulinečka cesta", area:77, rooms:3, price:176000, previousPrice:184000, condition:"održavano", floor:2, elevator:false, parking:true, year:2003, publishedAt:hoursAgo(12), comparables:16, microFactor:.98, imageTone:"amber", features:["Parking","Balkon","Mirna ulica"] },
  { id:"kv-108", source:"Nekretnine demo", title:"Moderan stan uz Kvaternikov trg", neighborhood:"Maksimir", street:"Šubićeva ulica", area:61, rooms:3, price:249000, previousPrice:null, condition:"renovirano", floor:4, elevator:true, parking:false, year:1938, publishedAt:hoursAgo(17), comparables:15, microFactor:1.09, imageTone:"mint", features:["Centar","Lift","Dizajnerski uređen"] },
  { id:"kv-109", source:"Agencija demo", title:"Prostrani stan blizu Save", neighborhood:"Trnje", street:"Prisavlje", area:104, rooms:4, price:318000, previousPrice:335000, condition:"održavano", floor:7, elevator:true, parking:true, year:1989, publishedAt:hoursAgo(22), comparables:10, microFactor:.98, imageTone:"slate", features:["Pogled","Garaža","Dvije lođe"] },
  { id:"kv-110", source:"Oglasnik demo", title:"Mali stan blizu okretišta", neighborhood:"Podsused", street:"Gajnice", area:43, rooms:2, price:99000, previousPrice:109000, condition:"za adaptaciju", floor:1, elevator:false, parking:false, year:1972, publishedAt:hoursAgo(28), comparables:13, microFactor:.97, imageTone:"peach", features:["Vlak 5 min","Spremište","Zelenilo"] },
  { id:"kv-111", source:"Nekretnine demo", title:"Uređen stan uz kampus", neighborhood:"Peščenica", street:"Borongajska cesta", area:58, rooms:3, price:169000, previousPrice:null, condition:"renovirano", floor:3, elevator:false, parking:true, year:1984, publishedAt:hoursAgo(31), comparables:17, microFactor:.96, imageTone:"lilac", features:["Parking","Balkon","Kampus"] },
  { id:"kv-112", source:"Agencija demo", title:"Građanski stan s karakterom", neighborhood:"Donji grad", street:"Klaićeva ulica", area:118, rooms:4, price:465000, previousPrice:480000, condition:"renovirano", floor:2, elevator:true, parking:false, year:1908, publishedAt:hoursAgo(40), comparables:8, microFactor:1.08, imageTone:"plum", features:["Centar","Lift","Strop 3.4 m"] }
];

export class DemoSource {
  name = "demo";
  async fetch() { return structuredClone(DEMO_LISTINGS); }
}

const decode = value => value
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/gi, " ")
  .replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
  .replace(/&scaron;/gi,"š").replace(/&Scaron;/g,"Š").replace(/&zcaron;/gi,"ž").replace(/&Zcaron;/g,"Ž")
  .replace(/&ccaron;/gi,"č").replace(/&Ccaron;/g,"Č").replace(/&cacute;/gi,"ć").replace(/&Cacute;/g,"Ć")
  .replace(/\s+/g, " ").trim();
const number = value => Number(value.replace(/\./g, "").replace(",", ".").replace(/[^0-9.]/g, ""));
const inferCondition = text => /novograd/i.test(text) ? "novogradnja" : /adapt|renoviranj|renovacij|za urediti/i.test(text) ? "za adaptaciju" : /renoviran|uređen|uredjen/i.test(text) ? "renovirano" : "održavano";
const inferRooms = text => Number((text.match(/(?:^|\s)([1-5])\s*[- ]?sob/i) || [])[1] || 2);
const inferFloor = text => Number((text.match(/(?:,|\s)(\d{1,2})\.\s*kat/i) || [])[1] || 0);
const inferBasement = text => /\bsuteren\b/i.test(text);
const parseDate = text => { const m=text.match(/Objavljen:\s*(\d{2})\.(\d{2})\.(\d{4})/i); return m ? new Date(`${m[3]}-${m[2]}-${m[1]}T12:00:00+02:00`).toISOString() : null; };
const toneFor = index => ["sage","clay","sand","blue","olive","rose","amber","mint","slate","peach","lilac","plum"][index%12];
const zagrebDay = value => new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Zagreb",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(value));
const wait = ms => new Promise(resolve=>setTimeout(resolve,ms));
const extractImage = html => {
  const match=html.match(/(?:src|data-src)=["']((?:https?:)?\/\/[^"']+\/image-200x150\/[^"']+|\/image-200x150\/[^"']+)["']/i)
    || html.match(/((?:https?:)?\/\/[^"'\s]+\/image-200x150\/[^"'\s<]+|\/image-200x150\/[^"'\s<]+)/i);
  if(!match) return null;
  try {
    const url=new URL(match[1].replace(/^\/\//,"https://"),"https://www.njuskalo.hr");
    if(!/(^|\.)njuskalo\.hr$/i.test(url.hostname) || !url.pathname.startsWith("/image-200x150/")) return null;
    return url.href;
  } catch { return null; }
};

export function parseNjuskaloList(html) {
  if (/hcaptcha|captcha-container|verify you are human/i.test(html)) {
    const error = new Error("Njuškalo traži potvrdu preglednika (CAPTCHA)");
    error.code = "NJUSKALO_BLOCKED";
    throw error;
  }
  const linkPattern = /<a\b[^>]*href=["'](\/nekretnine\/[^"']+-oglas-(\d+)(?:\?[^"']*)?)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const candidates=[];
  const seenIds=new Set();
  for(const match of html.matchAll(linkPattern)) {
    if(!seenIds.has(match[2])) { seenIds.add(match[2]); candidates.push(match); }
  }
  const unique=new Map();
  for (let index=0; index<candidates.length; index++) {
    const match=candidates[index];
    const start=match.index;
    const end=candidates[index+1]?.index ?? Math.min(html.length,match.index+5000);
    const rawBlock=html.slice(start,end);
    const block=decode(rawBlock);
    const areaMatch=block.match(/Stambena površina:\s*([\d.,]+)\s*m/i);
    const locationMatch=block.match(/Lokacija:\s*([^,<>]+),\s*([^<>]+?)(?=\s+(?:Objavljen:|Spremi|Prikaži|Tlocrt|\d[\d.]*\s*€))/i);
    const prices=[...block.matchAll(/([\d.]{4,})\s*€/g)].map(x=>number(x[1])).filter(x=>x>=30000&&x<=5000000);
    const title=decode(match[3]).replace(/\s*\(prodaja\)\s*$/i,"") || "Stan u Zagrebu";
    const area=areaMatch?number(areaMatch[1]):number((title.match(/([\d.,]+)\s*m[²2]/i)||[])[1]||"");
    const price=prices.at(-1);
    if (!area || !price || price/area<800 || price/area>15000) continue;
    const district=(locationMatch?.[1]||title.match(/Zagreb\s*\(([^)]+)\)/i)?.[1]||"Zagreb").trim();
    const micro=(locationMatch?.[2]||district).trim();
    const listingText=`${title} ${block}`;
    const basement=inferBasement(listingText);
    unique.set(match[2],{
      id:`nj-${match[2]}`, source:"Njuškalo", sourceUrl:`https://www.njuskalo.hr${match[1]}`,
      title, neighborhood:district, street:micro, area, rooms:inferRooms(`${title} ${block}`), price,
      previousPrice:null, condition:inferCondition(listingText), floor:inferFloor(block), basement,
      elevator:/\blift\b/i.test(block), parking:/parking|garaž|parkirno/i.test(block), year:0,
      publishedAt:parseDate(block)||"1970-01-01T00:00:00.000Z", comparables:12, microFactor:1, imageTone:toneFor(unique.size), imageUrl:extractImage(rawBlock),
      features:[basement&&"Suteren",/balkon|lođa|loggia|terasa/i.test(block)&&"Balkon / terasa",/\blift\b/i.test(block)&&"Lift",/parking|garaž|parkirno/i.test(block)&&"Parking"].filter(Boolean)
    });
    if(unique.size>=30) break;
  }
  return [...unique.values()];
}

export class NjuskaloSource {
  name="Njuškalo";
  url="https://www.njuskalo.hr/prodaja-stanova/zagreb";
  blockedUntil=0;
  lastRun=null;
  constructor({fetchImpl=globalThis.fetch,maxPages=12,delayMs=1800,now=()=>Date.now()}={}){this.fetchImpl=fetchImpl;this.maxPages=maxPages;this.delayMs=delayMs;this.now=now;}
  async fetch() {
    if(Date.now()<this.blockedUntil) throw new Error(`Njuškalo pauza nakon CAPTCHA-e do ${new Date(this.blockedUntil).toLocaleTimeString("hr-HR",{hour:"2-digit",minute:"2-digit"})}`);
    const targetDay=zagrebDay(this.now());
    const found=new Map();
    let pagesScanned=0;
    let stoppedReason="max-pages";
    for(let page=1;page<=this.maxPages;page++){
      const pageUrl=page===1?this.url:`${this.url}?page=${page}`;
      try{
        const response=await this.fetchImpl(pageUrl,{headers:{"User-Agent":"Kvadrat/0.3 (+Zagreb real-estate research)","Accept":"text/html,application/xhtml+xml","Accept-Language":"hr-HR,hr;q=0.9"},signal:AbortSignal.timeout(15000)});
        if(!response.ok)throw new Error(`Njuškalo HTTP ${response.status}`);
        const pageListings=parseNjuskaloList(await response.text());
        pagesScanned=page;
        const todays=pageListings.filter(item=>zagrebDay(item.publishedAt)===targetDay);
        for(const item of todays)found.set(item.id,item);
        if(pageListings.length===0){stoppedReason="empty-page";break;}
        if(todays.length===0){stoppedReason="older-than-today";break;}
      }catch(error){
        if(error.code==="NJUSKALO_BLOCKED")this.blockedUntil=Date.now()+6*60*60*1000;
        if(found.size){stoppedReason=error.code==="NJUSKALO_BLOCKED"?"captcha-partial":"error-partial";break;}
        throw error;
      }
      if(page<this.maxPages&&this.delayMs)await wait(this.delayMs);
    }
    const listings=[...found.values()];
    this.lastRun={pagesScanned,count:listings.length,stoppedReason,partial:/partial/.test(stoppedReason)};
    if(!listings.length)throw new Error("Njuškalo format nije prepoznat ili danas nema oglasa");
    return listings;
  }
}

import { IndexOglasiSource,NekretnineHrSource,OglasnikSource } from "./additional-sources.js";

// Izvori se pozivaju redom i s vlastitim ograničenjem zahtjeva. Zaštitne stranice
// i CAPTCHA odgovori nikada se ne zaobilaze; tada se zadržava zadnji valjani cache.
export const liveSources = [new NjuskaloSource(),new NekretnineHrSource(),new IndexOglasiSource(),new OglasnikSource()];
export const demoSource = new DemoSource();
