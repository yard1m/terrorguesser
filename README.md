# TerrorGuesser

A clue-ladder guessing game in four sections. You see a face and name the organisation, or in the
Interpol section, the crime. Each wrong guess, or each hint you ask for, opens another clue and lowers
the points the file is worth.

| Section | Source | Question | Clues |
|---|---|---|---|
| I · Türkiye | Turkish Interior Ministry terror-wanted list (2,512 people) | Which organisation? 6 buckets, or 18 organisations in Specialist mode | birth year → birthplace on a Turkey map → name → list tier |
| II · Global | Hand-picked historical roster plus Wikidata / Wikimedia Commons (174 people, 39 organisations, every photo reviewed by eye) | Which organisation? 6 options, or all of them in Specialist mode | lifespan → birthplace on a world map → nationality → name |
| IV · Lone attackers | Hand-written dataset of attacks by individuals or pairs (`scripts/build_lone.py`); only the 31 with a usable attacker photo are in the game | Which ideology? (white supremacist, jihadist, anti-government, left-wing, misogynist, anti-abortion) | year → place on a world map → target → attacker's name. Every file shows the attacker's photo (Wikimedia Commons, reviewed by eye). |
| III · Red Notice | Interpol public red-notice API, fetched **live** in the player's browser | What are they wanted for? (terrorism, homicide, sexual offences, drugs, fraud, organised violence) | age · sex → country of birth → requesting country → name |

The interface is in Turkish and English, with a TR · EN switch. It defaults to the browser's language.

**Map bonus (Türkiye and Global):** if you name the group before the birthplace clue is shown, you can click
the birthplace on a map for up to 250 extra points. Points fall off with distance (scale about 110 km for Turkey, 900 km for the world).

Each game is 10 files with 3 guesses per file. A file is worth 500 / 400 / 300 / 200 / 100 points
for 0–4 clues opened, doubled in Specialist mode. Stats are kept in localStorage.

## Run locally

```bash
python3 -m http.server 5173 --directory public
```

## Rebuild data

```bash
python3 scripts/build_data.py [--cached]   # Türkiye list → public/data/people.json, provinces.json
python3 scripts/build_global.py            # Global roster → public/data/global.json (Wikidata, cached QIDs)
python3 scripts/build_world.py             # Natural Earth → public/data/world.json
python3 scripts/build_lone.py              # Lone attackers → public/data/lone.json
```

### Curation rules for Global (see `scripts/build_global.py`)

- Members of organisations only. Lone-actor attackers (Christchurch, Utøya, Charleston, …) have no
  organisation to guess, so they live in section IV, where you guess the ideology instead.
- Only people who are dead, convicted, or who openly admitted their role.
- Every Wikidata match must carry the requested English Wikipedia article. Photos were reviewed by eye.
  Wrong subjects, artworks and images with the name printed in them are listed in `EXCLUDE_QIDS`.

### Interpol

The red-notice API blocks scripted bulk downloads, and this project does not try to get around that.
The Red Notice section fetches a handful of notices per game straight from the player's browser
(a list query for a random age, then one notice and its photo). Charges are sorted into categories by
multilingual keyword rules (`IP_CATS` in `public/app.js`). Notices that match no category are skipped.
If Interpol doesn't respond, the section shows an error and the other two sections keep working.

## Sources and licences

- Turkish list: terorarananlar.pol.tr (public). Photos are hotlinked, not re-hosted.
- Global photos: Wikimedia Commons (licences vary per file, and every verdict links to its file page). Data from Wikidata (CC0).
- Interpol: ws-public.interpol.int (public red notices, live).
- Maps: Natural Earth (public domain); tr-geojson and turkey-cities-districts-json (no licence stated).

Being on a wanted list or a red notice is an accusation, not a conviction. The footer and the About dialog say so.

### Lone attackers photos (see `scripts/build_lone.py`)

Photos come from three places, in this order: faces cropped out of Commons images that print the name
(`LOCAL`, saved in `public/img/lone/`), hand-picked Commons files (`FILES`), then the attacker's own Wikidata
item (P18, via their English Wikipedia article or a pinned QID). Attacks with no usable photo stay in
`ATTACKS` but are left out of `lone.json` (27 at the last build). Excluded after review: the attacker's
own propaganda images (Breivik's manifesto self-portrait), wrong people with the same name, and frames too
small to show a face.
