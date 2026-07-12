import test from "node:test";
import assert from "node:assert/strict";
import { accessAdjustmentPct,deduplicate,estimateListing,floorAdjustmentPct,labelFor } from "../lib/deal-engine.js";

const listing = { neighborhood:"Maksimir", area:60, price:180000, condition:"održavano", floor:2, elevator:true, parking:true, year:2000, comparables:12 };

test("izračunava cijenu po kvadratu i procjenu", () => {
  const result = estimateListing(listing);
  assert.equal(result.priceM2, 3000);
  assert.ok(result.expectedPrice > result.price);
  assert.ok(result.discountPct > 0);
  assert.ok(result.confidence >= 80);
});

test("dodjeljuje razumljive oznake", () => {
  assert.equal(labelFor(18), "Top prilika");
  assert.equal(labelFor(9), "Dobar deal");
  assert.equal(labelFor(4), "Ispod tržišta");
  assert.equal(labelFor(0), "Tržišna cijena");
  assert.equal(labelFor(-8), "Iznad tržišta");
});

test("uklanja duplikate unutar izvora, ali čuva oglase s različitih portala", () => {
  const a={ id:"a", source:"Portal A", neighborhood:"Trnje", area:70, price:200000, publishedAt:"2026-01-01" };
  const newer={ ...a, publishedAt:"2026-01-02" };
  const other={ ...a, source:"Portal B" };
  assert.deepEqual(deduplicate([a,newer,other]).map(x=>x.source), ["Portal A","Portal B"]);
});

test("primjenjuje postotak kata i progresivni penal bez lifta",()=>{
  assert.equal(floorAdjustmentPct(0),-6);
  assert.equal(floorAdjustmentPct(3),2);
  assert.equal(floorAdjustmentPct(6),0);
  assert.equal(accessAdjustmentPct(2,false),0);
  assert.equal(accessAdjustmentPct(3,false),-3);
  assert.equal(accessAdjustmentPct(5,false),-7);
  assert.equal(accessAdjustmentPct(7,false),-9);
  assert.equal(accessAdjustmentPct(4,true),1.5);
  const result=estimateListing({...listing,floor:4,elevator:false});
  assert.equal(result.floorAdjustmentPct,2);
  assert.equal(result.accessAdjustmentPct,-5);
});
