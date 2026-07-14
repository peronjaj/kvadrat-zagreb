const ZAGREB_CENTER=[45.815,15.9819];

const LOCATION_CENTERS={
  "Zagreb":ZAGREB_CENTER,
  "Donji grad":[45.8114,15.9772],
  "Gornji grad - Medveščak":[45.827,15.976],
  "Črnomerec":[45.824,15.936],
  "Maksimir":[45.829,16.018],
  "Peščenica - Žitnjak":[45.805,16.043],
  "Peščenica":[45.812,16.026],
  "Novi Zagreb":[45.769,15.975],
  "Novi Zagreb - istok":[45.766,16.008],
  "Novi Zagreb - zapad":[45.768,15.938],
  "Trešnjevka":[45.797,15.935],
  "Trešnjevka - sjever":[45.806,15.942],
  "Trešnjevka - jug":[45.787,15.93],
  "Trnje":[45.795,15.982],
  "Podsljeme":[45.867,15.982],
  "Gornja Dubrava":[45.852,16.052],
  "Donja Dubrava":[45.82,16.044],
  "Dubrava":[45.83,16.048],
  "Stenjevec":[45.808,15.897],
  "Podsused - Vrapče":[45.817,15.87],
  "Podsused":[45.823,15.835],
  "Sesvete":[45.827,16.112],
  "Brezovica":[45.729,15.909],
  "Fraterščica":[45.829,15.925],
  "Laščina":[45.834,16.008],
  "Lučko":[45.762,15.884],
  "Malešnica":[45.809,15.899],
  "Odra":[45.742,15.999],
  "Otok":[45.759,15.968],
  "Remete":[45.85,16.002],
  "Šalata":[45.829,15.986],
  "Sesvetska sela":[45.838,16.135],
  "Špansko":[45.8,15.898],
  "Sveta Klara":[45.754,15.972],
  "Veliko Polje":[45.744,16.039],
  "Volovčica":[45.805,16.022],
  "Vrhovec":[45.824,15.944]
};

const dynamicCopy={
  hr:{count:"oglasa ispod procjene na karti",empty:"Nema dealova za ove filtre.",open:"Otvori originalni oglas",estimated:"Približna lokacija kvarta",mapUnavailable:"Karta se nije mogla učitati. Dealovi su i dalje dostupni na popisu.",anySize:"Sve kvadrature",ranges:"raspona"},
  en:{count:"below-estimate listings on the map",empty:"No deals match these map filters.",open:"Open original listing",estimated:"Approximate neighbourhood location",mapUnavailable:"The map could not be loaded. Deals are still available in the list.",anySize:"Any size",ranges:"ranges"}
};

const SIZE_RANGES={under40:area=>area<=40,"40to60":area=>area>40&&area<=60,"60to80":area=>area>60&&area<=80,"80to100":area=>area>80&&area<=100,over100:area=>area>100};

let allDeals=[];
let currentLanguage="hr";
let mapInstance=null;
let markerLayer=null;
let markerById=new Map();
let initialized=false;
let appliedSizeRanges=[];

const byId=id=>globalThis.document?.getElementById(id);
const text=key=>dynamicCopy[currentLanguage][key]||key;
const escapeHtml=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const safeUrl=value=>{try{const url=new URL(value);return /^https?:$/.test(url.protocol)?url.href:null;}catch{return null;}};
const money=value=>new Intl.NumberFormat(currentLanguage==="en"?"en-IE":"hr-HR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(value);
const compactMoney=value=>value>=1000000?`${(value/1000000).toLocaleString(currentLanguage==="en"?"en-IE":"hr-HR",{maximumFractionDigits:1})}M €`:`${Math.round(value/1000)}K €`;
const compactM2=value=>`${Math.round(value).toLocaleString(currentLanguage==="en"?"en-IE":"hr-HR")} €/m²`;

function hash(value){
  let result=2166136261;
  for(const char of String(value)){result^=char.charCodeAt(0);result=Math.imul(result,16777619);}
  return result>>>0;
}

export function listingCoordinates(item){
  if(Number.isFinite(item.latitude)&&Number.isFinite(item.longitude))return[item.latitude,item.longitude];
  const center=LOCATION_CENTERS[item.neighborhood]||LOCATION_CENTERS[item.street]||ZAGREB_CENTER;
  const seed=hash(`${item.source}|${item.id}`);
  const angle=(seed%360)*Math.PI/180;
  const radius=.0015+((seed>>>8)%1000)/1000*.0045;
  return [Number((center[0]+Math.sin(angle)*radius).toFixed(6)),Number((center[1]+Math.cos(angle)*radius*1.45).toFixed(6))];
}

export function filterMapDeals(items,{area="all",source="all",maxPrice=Infinity,sizeRanges=[],minDeal=.1}={}){
  const selectedRanges=Array.isArray(sizeRanges)?sizeRanges.filter(key=>SIZE_RANGES[key]):[];
  return items.filter(item=>{
    const listingArea=Number(item.area??0);
    const matchesSize=!selectedRanges.length||selectedRanges.some(key=>SIZE_RANGES[key](listingArea));
    return item.discountPct>0&&(area==="all"||item.neighborhood===area)&&(source==="all"||item.source===source)&&item.price<=Number(maxPrice||Infinity)&&matchesSize&&item.discountPct>=Number(minDeal||.1);
  }).sort((a,b)=>b.discountPct-a.discountPct||a.price-b.price);
}

function currentFilters(){
  return{
    area:byId("mapAreaFilter")?.value||"all",
    source:byId("mapSourceFilter")?.value||"all",
    maxPrice:Number(byId("mapPriceFilter")?.value||Infinity),
    sizeRanges:appliedSizeRanges,
    minDeal:Number(byId("mapDealFilter")?.value||.1)
  };
}

function updateSizeSummary(){
  const summary=byId("mapSizeSummary");
  if(!summary)return;
  if(!appliedSizeRanges.length){summary.textContent=text("anySize");return;}
  if(appliedSizeRanges.length===1){
    const input=globalThis.document?.querySelector(`input[name="mapSizeRange"][value="${appliedSizeRanges[0]}"]`);
    summary.textContent=input?.closest("label")?.querySelector("span")?.textContent||text("anySize");
    return;
  }
  summary.textContent=`${appliedSizeRanges.length} ${text("ranges")}`;
}

function popupHtml(item){
  const link=safeUrl(item.sourceUrl);
  const floor=item.basement?(currentLanguage==="en"?"Basement":"Suteren"):`${item.floor}. ${currentLanguage==="en"?"floor":"kat"}`;
  return `<article class="map-popup"><span>${escapeHtml(item.neighborhood)} · ${escapeHtml(item.source)}</span><h3>${escapeHtml(item.title)}</h3><div><strong>${money(item.price)}</strong><b>−${item.discountPct}%</b></div><p>${item.area} m² · ${escapeHtml(floor)} · ${item.priceM2.toLocaleString(currentLanguage==="en"?"en-IE":"hr-HR")} €/m²</p>${link?`<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${text("open")} ↗</a>`:""}</article>`;
}

function markerColor(discount){
  const lightness=Math.max(24,40-Math.min(discount,25)*.55);
  return `hsl(151 64% ${lightness}%)`;
}

function renderDealList(items){
  const list=byId("mapDealList");
  if(!list)return;
  if(!items.length){list.innerHTML=`<div class="map-empty">${text("empty")}</div>`;return;}
  list.innerHTML=items.slice(0,40).map(item=>{
    const link=safeUrl(item.sourceUrl);
    return `<article class="map-deal-card"><button type="button" data-map-focus="${escapeHtml(item.id)}"><span>${escapeHtml(item.neighborhood)} · ${escapeHtml(item.source)}</span><strong>${escapeHtml(item.title)}</strong><div><b>${money(item.price)}</b><em>−${item.discountPct}%</em></div></button>${link?`<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" aria-label="${text("open")}">↗</a>`:""}</article>`;
  }).join("");
  list.querySelectorAll("[data-map-focus]").forEach(button=>button.addEventListener("click",()=>{
    const marker=markerById.get(button.dataset.mapFocus);
    if(marker&&mapInstance){
      mapInstance.setView(marker.getLatLng(),14,{animate:true});
      if(typeof markerLayer?.zoomToShowLayer==="function")markerLayer.zoomToShowLayer(marker,()=>marker.openPopup());
      else marker.openPopup();
    }
  }));
}

function renderMap({fit=true}={}){
  const items=filterMapDeals(allDeals,currentFilters());
  const count=byId("mapResultCount");
  if(count)count.textContent=`${items.length} ${text("count")}`;
  renderDealList(items);
  if(!markerLayer||!globalThis.L)return items;
  markerLayer.clearLayers();
  markerById=new Map();
  const bounds=[];
  for(const item of items){
    const coordinates=listingCoordinates(item);
    const priceM2=Number(item.priceM2)||Number(item.price)/Number(item.area||1);
    const icon=globalThis.L.divIcon({className:"deal-price-icon",html:`<span class="deal-price-marker" style="--marker-color:${markerColor(item.discountPct)}"><b>${compactMoney(item.price)}</b><small>${compactM2(priceM2)}</small></span>`,iconSize:[78,40],iconAnchor:[39,20],popupAnchor:[0,-20]});
    const marker=globalThis.L.marker(coordinates,{icon,title:`${money(item.price)} · −${item.discountPct}% · ${item.neighborhood}`}).bindPopup(popupHtml(item),{maxWidth:310});
    marker.on("popupopen",()=>marker.getElement()?.classList.add("is-selected"));
    marker.on("popupclose",()=>marker.getElement()?.classList.remove("is-selected"));
    marker.addTo(markerLayer);markerById.set(item.id,marker);bounds.push(coordinates);
  }
  if(fit&&bounds.length)mapInstance.fitBounds(bounds,{padding:[42,42],maxZoom:13});
  if(fit&&!bounds.length)mapInstance.setView(ZAGREB_CENTER,11);
  return items;
}

function addOptions(select,values){
  if(!select)return;
  for(const value of values)select.insertAdjacentHTML("beforeend",`<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`);
}

export function setDealMapLanguage(language){
  currentLanguage=language==="en"?"en":"hr";
  if(initialized){updateSizeSummary();renderMap({fit:false});}
}

export function initDealMap(items,{language="hr"}={}){
  if(!globalThis.document||initialized)return;
  initialized=true;currentLanguage=language==="en"?"en":"hr";allDeals=items.filter(item=>item.discountPct>0);
  addOptions(byId("mapAreaFilter"),[...new Set(allDeals.map(item=>item.neighborhood))].sort((a,b)=>a.localeCompare(b,"hr")));
  addOptions(byId("mapSourceFilter"),[...new Set(allDeals.map(item=>item.source))].sort((a,b)=>a.localeCompare(b,"hr")));
  ["mapAreaFilter","mapSourceFilter","mapPriceFilter","mapDealFilter"].forEach(id=>byId(id)?.addEventListener("change",()=>renderMap()));
  byId("applyMapSizeFilters")?.addEventListener("click",()=>{
    appliedSizeRanges=[...globalThis.document.querySelectorAll('input[name="mapSizeRange"]:checked')].map(input=>input.value);
    updateSizeSummary();byId("mapSizeFilter")?.removeAttribute("open");renderMap();
  });
  byId("resetMapFilters")?.addEventListener("click",()=>{
    byId("mapAreaFilter").value="all";byId("mapSourceFilter").value="all";byId("mapPriceFilter").value="";byId("mapDealFilter").value="0.1";
    globalThis.document.querySelectorAll('input[name="mapSizeRange"]').forEach(input=>{input.checked=false;});
    appliedSizeRanges=[];updateSizeSummary();renderMap();
  });
  if(globalThis.L){
    mapInstance=globalThis.L.map("dealMap",{scrollWheelZoom:false,zoomControl:true}).setView(ZAGREB_CENTER,11);
    globalThis.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(mapInstance);
    markerLayer=typeof globalThis.L.markerClusterGroup==="function"
      ?globalThis.L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:90,spiderfyOnMaxZoom:true,spiderfyDistanceMultiplier:2.2,zoomToBoundsOnClick:true,iconCreateFunction:cluster=>globalThis.L.divIcon({className:"deal-cluster-icon",html:`<span class="deal-cluster-marker"><b>${cluster.getChildCount()}</b><small>${currentLanguage==="en"?"deals":"dealova"}</small></span>`,iconSize:[44,44],iconAnchor:[22,22]})}).addTo(mapInstance)
      :globalThis.L.layerGroup().addTo(mapInstance);
  }else{
    const container=byId("dealMap");if(container)container.innerHTML=`<div class="map-load-error">${text("mapUnavailable")}</div>`;
  }
  renderMap();
}
