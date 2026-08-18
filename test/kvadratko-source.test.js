import test from "node:test";
import assert from "node:assert/strict";
import { KvadratkoSource,parseKvadratkoList } from "../lib/kvadratko-source.js";

const item=id=>({
  "@type":"ListItem",
  url:`https://www.kvadratko.hr/hr/prodaja/stan/o/${id}/stan-trnje-62-m2`,
  item:{
    "@type":"RealEstateListing",
    name:"Stan Trnje 62 m², 3-soban, lift i parking",
    url:`https://www.kvadratko.hr/hr/prodaja/stan/o/${id}/stan-trnje-62-m2`,
    image:"https://slike.kvadratko.hr/Projects/test/1.webp",
    offers:{price:"205000.00",priceCurrency:"EUR"},
    address:{addressLocality:"Trnje",addressCountry:"HR"}
  }
});

const fixture=entries=>`<script type="application/ld&#x2B;json">${JSON.stringify({"@context":"https://schema.org","@type":"ItemList",itemListElement:entries})}</script>`;

test("čita Kvadratko javni JSON-LD popis",()=>{
  const [listing]=parseKvadratkoList(fixture([item(32769)]),{now:Date.parse("2026-08-18T10:00:00Z")});
  assert.equal(listing.id,"kq-32769");
  assert.equal(listing.source,"Kvadratko.hr");
  assert.equal(listing.area,62);
  assert.equal(listing.price,205000);
  assert.equal(listing.rooms,3);
  assert.equal(listing.elevator,true);
  assert.equal(listing.parking,true);
  assert.equal(listing.dateEstimated,true);
});

test("Kvadratko crawler zaustavlja ponovljenu stranicu",async()=>{
  const calls=[];
  const html=fixture([item(32769)]);
  const source=new KvadratkoSource({fetchImpl:async url=>{calls.push(url);return{ok:true,text:async()=>html};},maxPages:5,delayMs:0,now:()=>Date.parse("2026-08-18T10:00:00Z")});
  const listings=await source.fetch();
  assert.equal(listings.length,1);
  assert.equal(calls.length,2);
  assert.equal(source.lastRun.stoppedReason,"duplicate-page");
});
