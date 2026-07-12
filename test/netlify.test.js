import test from "node:test";
import assert from "node:assert/strict";
import { listingsPayload,statsPayload } from "../lib/api-data.js";
import { config as scheduleConfig } from "../netlify/functions/start-sync.mjs";
import { config as backgroundConfig } from "../netlify/functions/update-listings.mjs";
import { config as listingsConfig } from "../netlify/functions/listings.mjs";
import listingsHandler from "../netlify/functions/listings.mjs";

const listings=[
  {id:"a",source:"Portal A",title:"Stan A",neighborhood:"Trnje",street:"Savica",price:150000,priceM2:3000,discountPct:10,publishedAt:"2026-07-12T08:00:00Z",firstSeenAt:"2026-07-12T08:00:00Z"},
  {id:"b",source:"Portal B",title:"Stan B",neighborhood:"Maksimir",street:"Ravnice",price:220000,priceM2:4000,discountPct:-2,publishedAt:"2026-07-12T09:00:00Z",firstSeenAt:"2026-07-12T09:00:00Z"}
];

test("Netlify konfiguracija koristi zakazani okidač i pozadinsku funkciju",()=>{
  assert.equal(scheduleConfig.schedule,"0 7,8 * * *");
  assert.equal(backgroundConfig.background,true);
  assert.equal(backgroundConfig.path,"/api/admin/sync");
  assert.equal(listingsConfig.path,"/api/listings");
});

test("zajednički API sloj daje iste filtre i statistike za Netlify",()=>{
  const data={listings,lastSync:"2026-07-12T09:00:00Z",sourceStatus:[]};
  const params=new URLSearchParams({source:"Portal A"});
  assert.deepEqual(listingsPayload(data,params).items.map(item=>item.id),["a"]);
  const stats=statsPayload(data,Date.parse("2026-07-12T10:00:00Z"));
  assert.equal(stats.total,2);
  assert.equal(stats.goodDeals,1);
  assert.equal(stats.averageM2,3500);
});

test("Netlify API koristi početni data.json prije prvog Blob zapisa",async()=>{
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async()=>Response.json({listings,lastSync:"2026-07-12T09:00:00Z",sourceStatus:[]});
  try{
    const response=await listingsHandler(new Request("https://kvadrat-test.netlify.app/api/listings?source=Portal%20B"));
    const payload=await response.json();
    assert.equal(response.status,200);
    assert.deepEqual(payload.items.map(item=>item.id),["b"]);
  }finally{globalThis.fetch=originalFetch;}
});
