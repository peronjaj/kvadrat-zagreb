import test from "node:test";
import assert from "node:assert/strict";
import { filterMapDeals,listingCoordinates } from "../public/deal-map.js";

const listings=[
  {id:"a",source:"Njuškalo",neighborhood:"Trnje",price:150000,area:62,discountPct:12},
  {id:"b",source:"Index Oglasi",neighborhood:"Maksimir",price:220000,area:91,discountPct:4},
  {id:"c",source:"Njuškalo",neighborhood:"Trnje",price:130000,area:48,discountPct:-2}
];

test("karta prikazuje samo oglase ispod procjene i primjenjuje svoje filtre",()=>{
  assert.deepEqual(filterMapDeals(listings).map(item=>item.id),["a","b"]);
  assert.deepEqual(filterMapDeals(listings,{area:"Trnje",source:"Njuškalo",maxPrice:160000,minDeal:8}).map(item=>item.id),["a"]);
  assert.equal(filterMapDeals(listings,{maxPrice:140000}).length,0);
  assert.deepEqual(filterMapDeals(listings,{sizeRanges:["80to100"]}).map(item=>item.id),["b"]);
  const multiSizeListings=[...listings,{id:"d",source:"Oglasnik.hr",neighborhood:"Trnje",price:115000,area:35,discountPct:7}];
  assert.deepEqual(filterMapDeals(multiSizeListings,{sizeRanges:["under40","80to100"]}).map(item=>item.id),["d","b"]);
  assert.equal(filterMapDeals(listings,{sizeRanges:["over100"]}).length,0);
});

test("oglas dobiva stabilnu približnu koordinatu unutar Zagreba",()=>{
  const first=listingCoordinates(listings[0]);
  const second=listingCoordinates(listings[0]);
  assert.deepEqual(first,second);
  assert.ok(first[0]>45.7&&first[0]<45.9);
  assert.ok(first[1]>15.8&&first[1]<16.2);
});
