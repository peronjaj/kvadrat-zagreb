# Kvadrat — Zagreb deal finder

MVP aplikacija koja objedinjuje oglase za stanove, procjenjuje tržišnu cijenu po
mikrolokaciji i označava oglase koji su ispod procijenjene vrijednosti.

Za potpuno besplatnu javnu objavu preporučen je GitHub Pages. Workflow u
`.github/workflows/deploy-pages.yml` osvježava `public/data.json` svaki dan u
09:00 i 17:00 po zoni Europe/Zagreb i zatim objavljuje mapu `public`. Precizne upute za
upload su u `DEPLOY_GITHUB.md`. Netlify konfiguracija ostaje kao neobavezna
rezervna mogućnost.

## Pokretanje

```powershell
npm.cmd start
```

Zatim otvorite `http://localhost:4173`.

## Testovi

```powershell
npm.cmd test
```

## Izvori podataka

Rotacija uključuje Njuškalo, Nekretnine.hr, Index Oglasi i Oglasnik.hr. Svi
adapteri čitaju samo javne popise, zadržavaju izvorni direktni URL i javno
dostupnu sliku. Ne prijavljuju se, ne dohvaćaju kontaktne podatke i ne
zaobilaze niti automatski rješavaju CAPTCHA zaštitu. Svaki izvor ima zaseban
status, pa privremeni problem jednog portala ne zaustavlja ostale.

Nekretnine.hr čita javne strukturirane podatke i uzima oglase koje portal
označava kao nove. Oglasnik.hr koristi njegov javni popis sortiran po datumu i
ograničava rezultate na Grad Zagreb i zadnja tri dana. Index Oglasi prvo
pokušava dohvatiti javni Zagreb feed; ako portal odbije serverski poziv, koristi
se vremenski ograničena provjerena javna snimka, jasno označena u statusu.

Sinkronizacija se izvodi pri pokretanju i zatim svaki dan u 09:00 i 17:00 po lokalnom
zagrebačkom vremenu. Nakon CAPTCHA-e
adapter radi pauzu od šest sati kako dodatnim zahtjevima ne bi produljio blokadu.
Može se ručno pokrenuti zahtjevom `POST /api/sync`. Status izvora vraća se uz
`/api/listings`. API podržava i `source` filtar, a sučelje nudi izbor portala.
Kod prikaza najnovijih oglasa izvori se izmjenjuju kako jedan veliki portal ne
bi potisnuo ostale s prvog ekrana.

Retencija oglasa:

- svi oglasi ostaju vidljivi tri dana od zadnjeg uspješnog viđenja;
- oglasi ispod procijenjene tržišne cijene ostaju sedam dana;
- promjene cijene spremaju se u `priceHistory`, a `firstSeenAt` i `lastSeenAt`
  bilježe prvo i posljednje viđenje oglasa.

## Tržišne osnovice

Formula koristi svih 17 zagrebačkih gradskih četvrti iz
`lib/market-benchmarks.js`. Vrijednosti su prosječne tražene prodajne cijene
stambenih nekretnina za lipanj 2026. s Nekretnine.hr. Ako lokacija nije
prepoznata, koristi se zagrebački prosjek traženih cijena stanova od 3.783 €/m²
objavljen na Micasa.hr 10.07.2026. Svaki obrađeni oglas u API-ju sadrži
`marketBaseM2`, `marketBenchmarkArea`, `marketBenchmarkPeriod` i
`marketBenchmarkSource` radi sljedivosti procjene.

Korekcija kata je odvojena od pristupa liftom: prizemlje nosi -6%, prvi kat
0%, drugi +1%, treći i četvrti +2%, peti +1%, a šesti i viši 0%. Ako nema
lifta, dodatni penal iznosi -3% na trećem, -5% na četvrtom, -7% na petom te
-9% na šestom i višem katu. Lift na drugom i višem katu donosi +1,5%.
Vrijednosti se u API-ju vide kao `floorAdjustmentPct` i `accessAdjustmentPct`.

## Netlify objava bez dnevnog deploya

Projekt je pripremljen za Netlify Free. Statička stranica objavljuje se iz
`public/`, API se izvršava kroz `netlify/functions`, a aktualni skup oglasa
sprema se u site-wide Netlify Blob `kvadrat-data/current`. Početni deploy sadrži
`public/data.json`, pa stranica radi odmah i prije prve cloud sinkronizacije.

Jutarnji `start-sync` radi u 07:00 i 08:00 UTC, ali nastavlja samo kad je u
vremenskoj zoni Europe/Zagreb 09:00. Time se automatski pokrivaju zimsko i
ljetno računanje vremena. Kratka zakazana funkcija pokreće
`update-listings` kao Background Function, koja ima dovoljno vremena za
ograničene pauze između portala i zatim sprema rezultat u Blobs. Za ručno
pokretanje postoji zaštićeni `POST /api/admin/trigger`.

Prije deploya u Netlify postavkama obavezno dodajte tajnu varijablu
`SYNC_SECRET`. Build postavke već su zapisane u `netlify.toml`; dovoljno je
spojiti GitHub repozitorij i pokrenuti prvi deploy. Besplatni Netlify URL i API
nakon toga rade bez stalno uključenog lokalnog računala.

Ako izvor na prvom pokretanju vrati CAPTCHA-u i još nema prethodnog cachea,
aplikacija koristi provjerenu javnu Njuškalo snimku od 12.07.2026. sa stvarnim
oglasima, fotografijama i izravnim URL-ovima. Takvi zapisi imaju `snapshot: true`
i u sučelju su jasno označeni kao snimka, ne kao osvježavanje uživo.

Skener prolazi `?page=2`, `?page=3` i dalje, najviše 12 stranica, dok ne dođe
do stranice bez oglasa objavljenih današnjeg datuma. Između stranica čeka 1,8
sekundi. Ako CAPTCHA prekine prolaz, već pronađeni oglasi se zadržavaju i, samo
ako je snimka izrađena istog dana, dopunjavaju provjerenom javnom snimkom.
