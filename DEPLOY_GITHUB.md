# GitHub: što uploadati i gdje kliknuti

Za ovu varijantu Netlify nije potreban. GitHub ima tri uloge:

1. Repository čuva projektne datoteke.
2. Actions svako jutro pokreće skener i mijenja `public/data.json`.
3. Pages besplatno poslužuje sadržaj mape `public`.

## Što uploadati

Na GitHub ide cijela projektna mapa:

`C:\Users\peron\Documents\Codex\2026-07-12\we`

Nemoj ručno birati samo `public`. Workflow treba i mape `lib`, `scripts`,
`test` i `.github`, kao i `package.json`, `package-lock.json` i ostale projektne
datoteke. Najsigurnije je koristiti GitHub Desktop jer će `.gitignore`
automatski izostaviti ono što ne treba uploadati:

- `node_modules/`
- `work/`
- `.agents/`
- `.codex/`
- `outputs/`
- lokalne logove

`public/data.json` se namjerno uploada. To je početni skup oglasa i datoteka
koju jutarnji automat dalje ažurira.

## 1. Napravi GitHub račun

1. Otvori `https://github.com/signup`.
2. Napravi besplatan osobni račun i potvrdi e-mail.
3. Za GitHub Pages na besplatnom računu ovaj repository treba biti **Public**.

## 2. Instaliraj GitHub Desktop

1. Otvori `https://desktop.github.com/`.
2. Instaliraj aplikaciju i prijavi se istim GitHub računom.
3. U GitHub Desktopu odaberi **File → Add local repository**.
4. Kao mapu odaberi:

   `C:\Users\peron\Documents\Codex\2026-07-12\we`

5. Ako se pojavi poruka da mapa nije Git repository, klikni
   **Create a repository here**.
6. Naziv ostavi `kvadrat-zagreb`, a Git ignore postavi na **None** jer projekt
   već ima ispravan `.gitignore`.
7. Klikni **Create repository**.

## 3. Napravi prvi commit i upload

1. U lijevom stupcu GitHub Desktopa trebaju se prikazati projektne datoteke.
2. Provjeri da se `node_modules` ne prikazuje među promjenama.
3. U polje **Summary** upiši `Prva verzija Kvadrata`.
4. Klikni **Commit to main**.
5. Klikni **Publish repository**.
6. Repository name: `kvadrat-zagreb`.
7. Makni kvačicu s **Keep this code private**.
8. Organization ostavi prazno ili **None**.
9. Klikni **Publish repository**.

Nakon toga će projekt biti na adresi:

`https://github.com/TVOJE-IME/kvadrat-zagreb`

## 4. Uključi GitHub Pages

1. Na GitHubu otvori repository `kvadrat-zagreb`.
2. Otvori **Settings**.
3. U lijevom izborniku otvori **Pages**.
4. Pod **Build and deployment → Source** odaberi **GitHub Actions**.
5. Ne biraj branch deploy i ne postavljaj `/docs` mapu.

## 5. Dopusti jutarnjem automatu spremanje data.json

1. U repositoryju otvori **Settings → Actions → General**.
2. Spusti se do **Workflow permissions**.
3. Odaberi **Read and write permissions**.
4. Klikni **Save**.

Workflow koristi GitHubov ugrađeni `GITHUB_TOKEN`; ne trebaš unositi API ključ,
lozinku ni Netlify podatke.

## 6. Pokreni prvu objavu

1. Otvori karticu **Actions** u repositoryju.
2. Ako GitHub pita, klikni **I understand my workflows, go ahead and enable
   them**.
3. Lijevo odaberi **Osvježi i objavi Kvadrat**.
4. Klikni **Run workflow → Run workflow**.
5. Pričekaj da posao postane zelen. Obično traje nekoliko minuta.
6. Adresa stranice bit će:

   `https://TVOJE-IME.github.io/kvadrat-zagreb/`

Točnu adresu vidiš i u zelenom poslu pod korakom **Objavi stranicu** te pod
**Settings → Pages**.

## 7. Što se dalje događa automatski

Datoteka `.github/workflows/deploy-pages.yml` svaki dan u 09:00 i 17:00 prema zoni
`Europe/Zagreb` radi sljedeće:

1. preuzme trenutni repository;
2. instalira zaključane ovisnosti;
3. skenira javno dostupne oglase;
4. primijeni formulu, retenciju od 3/7 dana i povijest cijene;
5. pokrene sve testove;
6. spremi novi `public/data.json` u repository;
7. objavi mapu `public` na GitHub Pages.

Ako Njuškalo ili drugi portal vrati CAPTCHA-u, workflow ne zaobilazi zaštitu,
nego zadržava zadnji valjani cache. Status svakog izvora vidljiv je na stranici
i u zapisu GitHub Actions posla.

## Što ne uploadati zasebno

Ne trebaš ništa stavljati u Netlify, FTP, Google Drive ili GitHub Releases.
Ne uploadavaj samo `index.html`, jer bez ostatka projekta jutarnji skener ne bi
mogao raditi. Jedini upload je cijela projektna mapa kroz GitHub Desktop.
