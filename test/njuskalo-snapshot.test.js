import test from "node:test";
import assert from "node:assert/strict";
import { NJUSKALO_SNAPSHOT } from "../lib/njuskalo-snapshot.js";

test("rezervna Njuškalo snimka sadrži samo stvarne direktne URL-ove i slike",()=>{
  assert.ok(NJUSKALO_SNAPSHOT.length>=20);
  assert.equal(new Set(NJUSKALO_SNAPSHOT.map(x=>x.id)).size,NJUSKALO_SNAPSHOT.length);
  for(const item of NJUSKALO_SNAPSHOT){
    assert.match(item.sourceUrl,/^https:\/\/www\.njuskalo\.hr\/nekretnine\/.+-oglas-\d+$/);
    assert.match(item.imageUrl,/^https:\/\/www\.njuskalo\.hr\/image-200x150\/nekretnine\/.+\.jpg$/);
    assert.ok(item.price>30000&&item.area>15);
  }
});
