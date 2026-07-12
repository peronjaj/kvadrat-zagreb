import { MARKET_BENCHMARKS_EUR_M2,MARKET_BENCHMARK_METADATA,ZAGREB_FALLBACK_EUR_M2 } from "./market-benchmarks.js";

const DISTRICT_ALIASES = {
  "Donji Grad":"Donji grad",
  "Gornji Grad - Medveščak":"Gornji grad - Medveščak",
  "Trešnjevka - Sjever":"Trešnjevka - sjever",
  "Trešnjevka - Jug":"Trešnjevka - jug",
  "Novi Zagreb - Istok":"Novi Zagreb - istok",
  "Novi Zagreb - Zapad":"Novi Zagreb - zapad",
  "Peščenica - Žitnjak":"Peščenica - Žitnjak",
  "Podsused - Vrapče":"Podsused - Vrapče"
};

export function normalizeNeighborhood(value) {
  return DISTRICT_ALIASES[value] ?? value;
}

const CONDITION_FACTOR = {
  "novogradnja": 1.18,
  "renovirano": 1.09,
  "održavano": 1,
  "za adaptaciju": 0.84
};

export function floorAdjustmentPct(floor){
  if(floor<=0)return -6;
  if(floor===1)return 0;
  if(floor===2)return 1;
  if(floor===3||floor===4)return 2;
  if(floor===5)return 1;
  return 0;
}

export function accessAdjustmentPct(floor,elevator){
  if(elevator)return floor>=2?1.5:0;
  if(floor<=2)return 0;
  if(floor===3)return -3;
  if(floor===4)return -5;
  if(floor===5)return -7;
  return -9;
}

export function estimateListing(listing) {
  const base = MARKET_BENCHMARKS_EUR_M2[listing.neighborhood] ?? ZAGREB_FALLBACK_EUR_M2;
  const sizeFactor = listing.area < 45 ? 1.09 : listing.area > 110 ? 0.92 : 1;
  const conditionFactor = CONDITION_FACTOR[listing.condition] ?? 1;
  const floorPct=floorAdjustmentPct(listing.floor);
  const accessPct=accessAdjustmentPct(listing.floor,listing.elevator);
  const floorFactor=1+floorPct/100;
  const accessFactor=1+accessPct/100;
  const parkingFactor = listing.parking ? 1.045 : 1;
  const buildFactor = listing.year >= 2015 ? 1.07 : listing.year < 1960 ? 0.96 : 1;
  const locationNoise = listing.microFactor ?? 1;
  const expectedM2 = Math.round(base * sizeFactor * conditionFactor * floorFactor * accessFactor * parkingFactor * buildFactor * locationNoise);
  const expectedPrice = Math.round((expectedM2 * listing.area) / 1000) * 1000;
  const actualM2 = Math.round(listing.price / listing.area);
  const discountPct = Number((((expectedPrice - listing.price) / expectedPrice) * 100).toFixed(1));
  const confidence = Math.min(94, 58 + (listing.comparables ?? 8) * 2 + (listing.year ? 4 : 0));

  return {
    ...listing,
    priceM2: actualM2,
    marketBaseM2:base,
    marketBenchmarkArea:MARKET_BENCHMARKS_EUR_M2[listing.neighborhood]?listing.neighborhood:"Grad Zagreb",
    marketBenchmarkPeriod:MARKET_BENCHMARK_METADATA.period,
    marketBenchmarkSource:MARKET_BENCHMARK_METADATA.source,
    floorAdjustmentPct:floorPct,
    accessAdjustmentPct:accessPct,
    expectedM2,
    expectedPrice,
    discountPct,
    confidence,
    label: labelFor(discountPct)
  };
}

export function labelFor(discountPct) {
  if (discountPct >= 15) return "Top prilika";
  if (discountPct >= 8) return "Dobar deal";
  if (discountPct >= 3) return "Ispod tržišta";
  if (discountPct >= -4) return "Tržišna cijena";
  return "Iznad tržišta";
}

export function deduplicate(listings) {
  const seen = new Map();
  for (const listing of listings) {
    const key = `${listing.source || "izvor"}|${listing.id}`;
    const existing = seen.get(key);
    if (!existing || new Date(listing.publishedAt) > new Date(existing.publishedAt)) seen.set(key, listing);
  }
  return [...seen.values()];
}

export const marketBenchmarks = MARKET_BENCHMARKS_EUR_M2;
export const marketBenchmarkMetadata = MARKET_BENCHMARK_METADATA;
