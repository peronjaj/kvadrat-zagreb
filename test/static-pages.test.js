import test from "node:test";
import assert from "node:assert/strict";
import { staticListingsPayload,staticStatsPayload } from "../public/data-client.js";

const listings=[
  {id:"a",source:"Portal A",title:"Stan Trnje",neighborhood:"Trnje",street:"Savica",price:150000,priceM2:3000,discountPct:12,publishedAt:"2026-07-12T08:00:00Z",firstSeenAt:"2026-07-12T08:00:00Z"},
  {id:"b",source:"Portal B",title:"Stan Maksimir",neighborhood:"Maksimir",street:"Ravnice",price:210000,priceM2:4200,discountPct:-2,publishedAt:"2026-07-12T09:00:00Z",firstSeenAt:"2026-07-12T09:00:00Z"}
];

test("GitHub Pages statički način podržava filtre i statistike",()=>{
  const data={listings,lastSync:"2026-07-12T09:00:00Z",sourceStatus:[]};
  const payload=staticListingsPayload(data,new URLSearchParams({area:"Trnje",minDeal:"8"}));
  assert.deepEqual(payload.items.map(item=>item.id),["a"]);
  assert.equal(payload.staticMode,true);
  const stats=staticStatsPayload(data,Date.parse("2026-07-12T10:00:00Z"));
  assert.equal(stats.total,2);
  assert.equal(stats.goodDeals,1);
  assert.equal(stats.averageM2,3600);

  const combined=staticListingsPayload(data,new URLSearchParams({source:"Portal A",maxPrice:"160000",q:"savica",sort:"price"}));
  assert.deepEqual(combined.items.map(item=>item.id),["a"]);
  const empty=staticListingsPayload(data,new URLSearchParams({source:"Portal B",maxPrice:"200000"}));
  assert.equal(empty.items.length,0);
});
