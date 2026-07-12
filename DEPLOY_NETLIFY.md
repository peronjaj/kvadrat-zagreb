# Objavljivanje Kvadrata na Netlifyju

Projekt je već prilagođen za Netlify Free: koristi Netlify Functions, jednu
Background Function, zakazani jutarnji okidač i Netlify Blobs. Ne radi se novi
produkcijski deploy svakog jutra.

## 1. Objavite projekt na GitHub

1. Na GitHubu napravite osobni repozitorij `kvadrat-zagreb` (može biti private).
2. U GitHub Desktopu odaberite **File → Add local repository**.
3. Odaberite mapu `C:\Users\peron\Documents\Codex\2026-07-12\we`.
4. Ako je potrebno, odaberite **Create a repository here**.
5. Napravite commit svih projektnih datoteka.
6. Kliknite **Publish repository** i objavite ga na svom GitHub računu.

Ne spremajte `SYNC_SECRET` u GitHub. Mape `node_modules/` i `work/data.json`
već su isključene, dok je `public/data.json` namjerno uključen kao početni skup
oglasa za prvi deploy.

## 2. Spojite Netlify

1. Prijavite se na `https://app.netlify.com/` preko GitHuba.
2. Odaberite **Add new project → Import an existing project → GitHub**.
3. Dajte Netlifyju pristup osobnom repozitoriju `kvadrat-zagreb`.
4. Odaberite produkcijsku granu `main`.
5. Netlify će automatski pročitati `netlify.toml`:
   - build command: `npm run build:netlify`
   - publish directory: `public`
   - functions directory: `netlify/functions`
6. Nemojte ručno mijenjati te tri vrijednosti.

## 3. Dodajte tajnu prije prvog deploya

1. U projektu otvorite **Project configuration → Environment variables**.
2. Dodajte varijablu naziva `SYNC_SECRET`.
3. Kao vrijednost unesite nasumičnu lozinku od barem 32 znaka.
4. Spremite varijablu za sve deploy kontekste.
5. Pokrenite **Deploy site**.

## 4. Provjerite objavu

Nakon deploya otvorite:

- `https://IME-PROJEKTA.netlify.app/`
- `https://IME-PROJEKTA.netlify.app/api/health`
- `https://IME-PROJEKTA.netlify.app/api/listings`

Health ruta treba vratiti `{"ok":true,"platform":"netlify"}`, a listings ruta
početni skup oglasa. Pod **Functions** trebaju biti vidljive funkcije
`start-sync`, `update-listings`, `listings`, `stats`, `health` i `trigger-sync`.

## 5. Ručno pokrenite prvu cloud sinkronizaciju

U PowerShellu pokrenite sljedeće, zamijenite adresu svojom Netlify adresom i
unesite istu tajnu kada se zatraži:

```powershell
$secret = Read-Host "SYNC_SECRET"
Invoke-WebRequest -Method Post -Uri "https://IME-PROJEKTA.netlify.app/api/admin/trigger" -Headers @{ Authorization = "Bearer $secret" }
```

Odgovor `202` znači da je pozadinska sinkronizacija pokrenuta. Pričekajte do
dvije minute, zatim osvježite `/api/listings`. Rezultat se sprema u site-wide
Blob `kvadrat-data/current` i ostaje dostupan nakon budućih deployeva.

## 6. Jutarnje osvježavanje

Netlify pokreće `start-sync` u 07:00 i 08:00 UTC. Funkcija provjerava vrijeme u
zoni `Europe/Zagreb` i samo jedan od ta dva poziva, onaj koji pada u 09:00 po
lokalnom vremenu, pokreće stvarnu sinkronizaciju. Tako raspored radi i nakon
promjene zimskog/ljetnog računanja vremena.

Status i zapise izvršavanja provjerite pod **Functions → start-sync** i
**Functions → update-listings**. Ako neki portal vrati CAPTCHA-u ili zaštitnu
stranicu, updater zadržava zadnji valjani cache; zaštita se ne zaobilazi.

## 7. Besplatni plan

Ovaj pristup ne radi dnevni produkcijski deploy. Kredite troše samo početni i
budući deployevi koda, malo funkcijskog vremena, web zahtjevi i mala količina
JSON prometa. U Netlifyju povremeno provjerite **Billing → Account usage
insights**. Free plan ima tvrdi limit, pa bez ručne nadogradnje nema automatske
naplate.
