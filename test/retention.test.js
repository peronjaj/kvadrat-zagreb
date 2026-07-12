import test from "node:test";
import assert from "node:assert/strict";
import { DAY_MS,mergeAndRetain } from "../lib/retention.js";

const now=Date.parse("2026-07-12T09:00:00Z");
const old=(id,days,discountPct)=>({id,price:100000,discountPct,lastSeenAt:new Date(now-days*DAY_MS).toISOString(),publishedAt:"2026-01-01"});

test("obične oglase čuva 3 dana, a one ispod tržišta 7 dana",()=>{
  const result=mergeAndRetain([old("regular-2",2,-1),old("regular-4",4,-1),old("deal-6",6,5),old("deal-8",8,5)],[],now);
  assert.deepEqual(result.map(x=>x.id).sort(),["deal-6","regular-2"]);
});

test("ponovno viđen oglas osvježava lastSeen i čuva povijest cijene",()=>{
  const previous={...old("a",2,8),firstSeenAt:"2026-07-01T09:00:00Z"};
  const [item]=mergeAndRetain([previous],[{...previous,price:95000}],now);
  assert.equal(item.firstSeenAt,"2026-07-01T09:00:00Z");
  assert.equal(item.lastSeenAt,new Date(now).toISOString());
  assert.deepEqual(item.priceHistory,[{price:100000,at:previous.lastSeenAt}]);
});

test("starom cacheu bez tracking polja dodaje potrebne datume",()=>{
  const publishedAt=new Date(now-DAY_MS).toISOString();
  const [item]=mergeAndRetain([{id:"legacy",price:90000,discountPct:2,publishedAt}],[],now);
  assert.equal(item.firstSeenAt,publishedAt);
  assert.equal(item.lastSeenAt,publishedAt);
  assert.deepEqual(item.priceHistory,[]);
});
