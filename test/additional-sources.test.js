import test from "node:test";
import assert from "node:assert/strict";
import { parseIndexPayload,parseNekretnineHrList,parseOglasnikRsc } from "../lib/additional-sources.js";

test("čita novi Nekretnine.hr oglas iz javnih strukturiranih podataka",()=>{
  const data={props:{pageProps:{dehydratedState:{queries:[{queryKey:["real-estate-list"],state:{data:{results:[{realEstate:{id:123,isNew:true,title:"Trosobni stan Trnje, Zagreb",price:{value:210000},properties:[{surface:"60 m²",rooms:"3",floor:{value:"2. kat"},description:"Renoviran stan s parkingom",location:{macrozone:"Trnje",microzone:"Savica"},featureList:[{type:"elevator",compactLabel:"Da"}],photo:{urls:{small:"https://pic.nekretnine.hr/image/1/xxs-c.jpg"}}}]},seo:{url:"https://www.nekretnine.hr/oglasi/123/"}}]}}}]}}}};
  const html=`<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(data)}</script>`;
  const [item]=parseNekretnineHrList(html,{now:Date.parse("2026-07-12T09:00:00Z")});
  assert.equal(item.id,"ne-123");assert.equal(item.neighborhood,"Trnje");assert.equal(item.area,60);assert.equal(item.elevator,true);assert.match(item.sourceUrl,/oglasi\/123/);
});

test("čita samo nedavne zagrebačke Oglasnik.hr oglase",()=>{
  const ad={id:77,title:"Stan Trnje 55 m2",location:[{name:"Hrvatska"},{name:"Grad Zagreb"},{name:"Trnje"}],price:{value:180000},publish:"12.07.2026 09:00:00",details:[{params:[{slug:"re_total_area",value:"55"},{slug:"re_flat_room_number",value:"2-sobni"},{slug:"re_floor_number",value:"3"},{slug:"re_construction_year",value:"2005"},{slug:"re_parking_number",value:"1"}]}],media:[{listing:"https://media.oglasnik.hr/ads/test-listing.jpg"}]};
  const [item]=parseOglasnikRsc(`x:{"ad":${JSON.stringify(ad)},"isHomepage":false}`,{now:Date.parse("2026-07-12T10:00:00Z")});
  assert.equal(item.id,"og-77");assert.equal(item.area,55);assert.equal(item.floor,3);assert.equal(item.parking,true);assert.match(item.sourceUrl,/oglas-77$/);
});

test("odbacuje Nekretnine.hr oglas s nerealnom cijenom",()=>{
  const data={props:{pageProps:{dehydratedState:{queries:[{queryKey:["real-estate-list"],state:{data:{results:[{realEstate:{id:124,isNew:true,title:"Stan s cijenom na upit",price:{value:1},properties:[{surface:"100 m²",rooms:"3",location:{macrozone:"Zagreb"}}]}}]}}}]}}}};
  const html=`<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(data)}</script>`;
  assert.deepEqual(parseNekretnineHrList(html,{now:Date.parse("2026-07-12T09:00:00Z"),onlyNew:false}),[]);
});

test("Oglasnik.hr uključuje propuštene oglase iz 12-dnevnog prozora",()=>{
  const base={title:"Stan Maksimir 50 m2",location:[{name:"Hrvatska"},{name:"Grad Zagreb"},{name:"Maksimir"}],price:{value:190000},details:[{params:[{slug:"re_total_area",value:"50"}]}]};
  const recent={...base,id:78,publish:"02.07.2026 09:00:00"};
  const stale={...base,id:79,publish:"29.06.2026 09:00:00"};
  const text=`x:{"ad":${JSON.stringify(recent)},"isHomepage":false} y:{"ad":${JSON.stringify(stale)},"isHomepage":false}`;
  const items=parseOglasnikRsc(text,{now:Date.parse("2026-07-12T10:00:00Z")});
  assert.deepEqual(items.map(item=>item.id),["og-78"]);
});

test("normalizira javni Index JSON feed",()=>{
  const payload={items:[{id:88,title:"Dvosoban stan Maksimir u suterenu",area:50,price:{value:190000},rooms:2,floor:"suteren",year:1999,publishedAt:"2026-07-12T08:00:00Z",location:{name:"Maksimir"},url:"/oglasi/nekretnine/prodaja-stanova/oglas/test/88"}]};
  const [item]=parseIndexPayload(payload,{now:Date.parse("2026-07-12T10:00:00Z")});
  assert.equal(item.id,"ix-88");assert.equal(item.price,190000);assert.equal(item.neighborhood,"Maksimir");assert.equal(item.basement,true);assert.match(item.sourceUrl,/index\.hr/);
});
