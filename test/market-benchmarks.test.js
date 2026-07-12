import test from "node:test";
import assert from "node:assert/strict";
import { MARKET_BENCHMARKS_EUR_M2,ZAGREB_FALLBACK_EUR_M2 } from "../lib/market-benchmarks.js";
import { estimateListing,normalizeNeighborhood } from "../lib/deal-engine.js";

test("formula sadrži svih 17 zagrebačkih gradskih četvrti",()=>{
  assert.equal(Object.keys(MARKET_BENCHMARKS_EUR_M2).length,17);
  assert.equal(MARKET_BENCHMARKS_EUR_M2["Brezovica"],2781);
  assert.equal(MARKET_BENCHMARKS_EUR_M2["Trešnjevka - jug"],4736);
  for(const value of Object.values(MARKET_BENCHMARKS_EUR_M2))assert.ok(value>=2700&&value<=4800);
});

test("Njuškalo nazive mapira na odgovarajuću gradsku četvrt",()=>{
  assert.equal(normalizeNeighborhood("Novi Zagreb - Istok"),"Novi Zagreb - istok");
  assert.equal(normalizeNeighborhood("Gornji Grad - Medveščak"),"Gornji grad - Medveščak");
  assert.equal(normalizeNeighborhood("Trešnjevka - Jug"),"Trešnjevka - jug");
});

test("procjena bilježi korištenu osnovicu, razdoblje i izvor",()=>{
  const result=estimateListing({neighborhood:"Trnje",area:70,price:300000,condition:"održavano",floor:2,elevator:true,parking:false,year:2000});
  assert.equal(result.marketBaseM2,4257);
  assert.equal(result.marketBenchmarkArea,"Trnje");
  assert.equal(result.marketBenchmarkPeriod,"2026-06");
  assert.ok(result.marketBenchmarkSource);
  const fallback=estimateListing({neighborhood:"Nepoznato",area:70,price:300000,condition:"održavano",floor:2,elevator:false,parking:false,year:2000});
  assert.equal(fallback.marketBaseM2,ZAGREB_FALLBACK_EUR_M2);
  assert.equal(fallback.marketBenchmarkArea,"Grad Zagreb");
});
