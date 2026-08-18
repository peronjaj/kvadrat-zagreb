import test from "node:test";
import assert from "node:assert/strict";
import { CroRealSource,parseCroRealList } from "../lib/croreal-source.js";

const item=(id,{area=62,price=205000,rooms=3,location="Trnje"}={})=>({
  "@type":"ListItem",
  item:{
    "@type":"RealEstateListing",
    url:`https://www.croreal.com/hr/stan-na-prodaju/grad-zagreb/${location.toLowerCase()}/hr-${id}`,
    name:`Stan na prodaju ${area} m² – ${location}`,
    offers:{
      price,
      itemOffered:{
        "@type":"Apartment",
        address:{addressLocality:location,addressCountry:"HR"},
        floorSize:{value:area,unitCode:"MTK"},
        numberOfRooms:rooms
      }
    },
    image:[`https://img.croreal.com/${id}/full/1.jpg`]
  }
});

const fixture=entries=>`<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"ItemList",itemListElement:entries})}</script>`;

test("čita CroReal javni JSON-LD popis",()=>{
  const [listing]=parseCroRealList(fixture([item(12345)]),{now:Date.parse("2026-08-18T10:00:00Z")});
  assert.equal(listing.id,"cr-12345");
  assert.equal(listing.source,"CroReal.com");
  assert.equal(listing.neighborhood,"Trnje");
  assert.equal(listing.area,62);
  assert.equal(listing.price,205000);
  assert.equal(listing.dateEstimated,true);
  assert.match(listing.sourceUrl,/croreal\.com/);
});

test("CroReal crawler zaustavlja ponovljenu stranicu",async()=>{
  const calls=[];
  const html=fixture([item(12345)]);
  const source=new CroRealSource({fetchImpl:async url=>{calls.push(url);return{ok:true,text:async()=>html};},maxPages:5,delayMs:0,now:()=>Date.parse("2026-08-18T10:00:00Z")});
  const listings=await source.fetch();
  assert.equal(listings.length,1);
  assert.equal(calls.length,2);
  assert.equal(source.lastRun.stoppedReason,"duplicate-page");
});
