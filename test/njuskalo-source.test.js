import test from "node:test";
import assert from "node:assert/strict";
import { NjuskaloSource,parseNjuskaloList } from "../lib/sources.js";

const fixture = `
<article>
  <h3><a href="/nekretnine/tresnjevka-dvosobni-stan-56-m2-oglas-47700001">Trešnjevka – dvosobni stan 56,8 m², za renovaciju</a></h3>
  <img src="https://www.njuskalo.hr/image-200x150/nekretnine/stan-tresnjevka-slika-123.jpg" alt="Stan" />
  <p>Stan u stambenoj zgradi, 5. kat</p>
  <p>Stambena površina: 56,8 m2</p>
  <p>Lokacija: Trešnjevka - Sjever, Trešnjevka</p>
  <p>Objavljen: 12.07.2026.</p>
  <strong>219.000 €</strong>
</article>`;

test("pretvara Njuškalo karticu u interni oglas", () => {
  const [item] = parseNjuskaloList(fixture);
  assert.equal(item.id, "nj-47700001");
  assert.equal(item.area, 56.8);
  assert.equal(item.price, 219000);
  assert.equal(item.neighborhood, "Trešnjevka - Sjever");
  assert.equal(item.condition, "za adaptaciju");
  assert.equal(item.floor, 5);
  assert.equal(item.imageUrl, "https://www.njuskalo.hr/image-200x150/nekretnine/stan-tresnjevka-slika-123.jpg");
  assert.match(item.sourceUrl, /njuskalo\.hr/);
});

test("prepoznaje Njuškalo CAPTCHA odgovor", () => {
  assert.throws(() => parseNjuskaloList('<script src="https://hcaptcha.com/1/api.js"></script>'), /CAPTCHA/);
});

test("prepoznaje suteren kao zasebnu karakteristiku",()=>{
  const html=`<article><a href="/nekretnine/stan-suteren-zagreb-oglas-47700002">Stan u suterenu 45 m2</a><p>Etaža: suteren</p><p>Stambena površina: 45 m2</p><p>Lokacija: Trnje, Savica</p><p>Objavljen: 12.07.2026.</p><strong>120.000 €</strong></article>`;
  const [item]=parseNjuskaloList(html);
  assert.equal(item.floor,0);
  assert.equal(item.basement,true);
  assert.ok(item.features.includes("Suteren"));
});

const pageFixture=(id,date)=>`<article><a href="/nekretnine/stan-zagreb-oglas-${id}">Dvosoban stan Zagreb 50 m2</a><img src="https://www.njuskalo.hr/image-200x150/nekretnine/stan-${id}-slika-1.jpg"><p>Stan u stambenoj zgradi, 1. kat</p><p>Stambena površina: 50 m2</p><p>Lokacija: Trnje, Trnje</p><p>Objavljen: ${date}.</p><strong>180.000 €</strong></article>`;

test("prolazi stranice dok ne dođe do oglasa starijih od danas",async()=>{
  const calls=[];
  const pages=[pageFixture("50000001","12.07.2026"),pageFixture("50000002","11.07.2026")];
  const source=new NjuskaloSource({fetchImpl:async url=>{calls.push(url);return{ok:true,text:async()=>pages[calls.length-1]};},maxPages:5,delayMs:0,now:()=>Date.parse("2026-07-12T07:00:00Z")});
  const items=await source.fetch();
  assert.deepEqual(items.map(x=>x.id),["nj-50000001"]);
  assert.deepEqual(calls,["https://www.njuskalo.hr/prodaja-stanova/zagreb","https://www.njuskalo.hr/prodaja-stanova/zagreb?page=2"]);
  assert.equal(source.lastRun.stoppedReason,"older-than-today");
});

test("čuva već pronađene oglase ako CAPTCHA stigne na sljedećoj stranici",async()=>{
  let call=0;
  const source=new NjuskaloSource({fetchImpl:async()=>({ok:true,text:async()=>++call===1?pageFixture("50000003","12.07.2026"):'<script src="https://hcaptcha.com/1/api.js"></script>'}),maxPages:5,delayMs:0,now:()=>Date.parse("2026-07-12T07:00:00Z")});
  const items=await source.fetch();
  assert.equal(items.length,1);
  assert.equal(source.lastRun.stoppedReason,"captcha-partial");
  assert.equal(source.lastRun.partial,true);
});
