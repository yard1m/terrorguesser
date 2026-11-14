#!/usr/bin/env python3
"""Fetch the Turkish Interior Ministry terror-wanted list and build the game's data files.

Usage:
    python3 scripts/build_data.py            # fetch live list
    python3 scripts/build_data.py --cached   # reuse sources/wanted_raw.json

Outputs (public/data/):
    people.json     one compact record per person who has a photo
    provinces.json  simplified province outlines as SVG path strings
"""
import ast
import datetime as dt
import json
import math
import re
import sys
import unicodedata
import urllib.request
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "sources"
OUT = ROOT / "public" / "data"
BASE = "https://www.terorarananlar.pol.tr"
ENDPOINT = BASE + "/ISAYWebPart/TArananlar/GetTerorleArananlarList"

LISTS = {"kirmizi": "red", "turuncu": "orange", "sari": "yellow", "gri": "grey"}

# Hard-mode organisation id -> (display name, easy-mode bucket)
ORGS = {
    "PKK/KCK": ("pkk", "PKK/KCK", "pkk"),
    "FETÖ/PDY": ("feto", "FETÖ/PDY", "feto"),
    "DHKP/C": ("dhkpc", "DHKP-C", "dhkpc"),
    "DEAŞ": ("deas", "DEAŞ (ISIS)", "deas"),
    "MLKP": ("mlkp", "MLKP", "left"),
    "EL KAİDE": ("alqaeda", "El Kaide (al-Qaeda)", "islamist"),
    "MKP": ("mkp", "MKP", "left"),
    "HİZBULLAH": ("hizbullah", "Hizbullah (Turkish)", "islamist"),
    "TKP/ML": ("tkpml", "TKP/ML", "left"),
    "TKP-ML Konferans": ("tkpmlk", "TKP/ML Konferans", "left"),
    "DKP/BÖG": ("dkp", "DKP/BÖG", "left"),
    "HTŞ": ("hts", "HTŞ", "islamist"),
    "TİKB": ("tikb", "TİKB", "left"),
    "MLSPB": ("mlspb", "MLSPB", "left"),
    "TKEP/L": ("tkepl", "TKEP/L", "left"),
    "THKP/C": ("thkpc", "THKP-C", "left"),
    "DEVRİMCİ KARARGAH": ("dk", "Devrimci Karargah", "left"),
    "TEVHİD-SELAM KUDÜS ORDUSU": ("tevhid", "Tevhid-Selam / Kudüs Ordusu", "islamist"),
    # A.F.İ.D (1 person) is left out: its ideology could not be confirmed for the easy-mode buckets.
}

PROVINCE_ALIASES = {"AFYONKARAHISAR": "AFYON", "KMARAS": "KAHRAMANMARAS", "MARAS": "KAHRAMANMARAS",
                    "SURFA": "SANLIURFA", "URFA": "SANLIURFA", "ICEL": "MERSIN", "ANTEP": "GAZIANTEP",
                    "DERSIM": "TUNCELI", "HAKKARI": "HAKKARI"}
# Districts renamed or commonly spelt differently on the list
DISTRICT_ALIASES = {"DOGUBEYAZIT": "DOGUBAYAZIT", "HASANKALE": "PASINLER", "HAYDARPASA": "KADIKOY",
                    "TUNCBILEK": "TAVSANLI", "DK": "DANIMARKA", "ZURICH": "ISVICRE"}

COUNTRIES = {  # folded name -> (English name, lat, lon)
    "SURIYE": ("Syria", 35.0, 38.5), "IRAK": ("Iraq", 33.2, 43.7), "IRAN": ("Iran", 32.4, 53.7),
    "ALMANYA": ("Germany", 51.2, 10.4), "FRANSA": ("France", 46.6, 2.2), "HOLLANDA": ("Netherlands", 52.1, 5.3),
    "BELCIKA": ("Belgium", 50.5, 4.5), "ISVICRE": ("Switzerland", 46.8, 8.2), "AVUSTURYA": ("Austria", 47.5, 14.6),
    "INGILTERE": ("United Kingdom", 52.4, -1.5), "ISVEC": ("Sweden", 60.1, 18.6), "DANIMARKA": ("Denmark", 56.0, 9.5),
    "AZERBAYCAN": ("Azerbaijan", 40.1, 47.6), "RUSYA": ("Russia", 55.7, 37.6), "GURCISTAN": ("Georgia", 42.3, 43.4),
    "BULGARISTAN": ("Bulgaria", 42.7, 25.5), "YUNANISTAN": ("Greece", 39.1, 21.8), "LUBNAN": ("Lebanon", 33.9, 35.9),
    "MISIR": ("Egypt", 26.8, 30.8), "KAZAKISTAN": ("Kazakhstan", 48.0, 66.9), "OZBEKISTAN": ("Uzbekistan", 41.4, 64.6),
    "TACIKISTAN": ("Tajikistan", 38.9, 71.3), "KIRGIZISTAN": ("Kyrgyzstan", 41.2, 74.8), "TURKMENISTAN": ("Turkmenistan", 38.97, 59.6),
    "DAGISTAN": ("Dagestan (Russia)", 42.9, 47.1), "CECENISTAN": ("Chechnya (Russia)", 43.4, 45.7),
    "TUNUS": ("Tunisia", 33.9, 9.5), "FAS": ("Morocco", 31.8, -7.1), "CEZAYIR": ("Algeria", 28.0, 1.7),
    "LIBYA": ("Libya", 26.3, 17.2), "URDUN": ("Jordan", 30.6, 36.2), "SUUDIARABISTAN": ("Saudi Arabia", 23.9, 45.1),
    "AFGANISTAN": ("Afghanistan", 33.9, 67.7), "PAKISTAN": ("Pakistan", 30.4, 69.3), "KIBRIS": ("Cyprus", 35.1, 33.4),
    "KKTC": ("Northern Cyprus", 35.25, 33.6), "ABD": ("United States", 38.0, -97.0), "AMERIKA": ("United States", 38.0, -97.0),
    "KANADA": ("Canada", 56.1, -106.3), "AVUSTRALYA": ("Australia", -25.3, 133.8), "NORVEC": ("Norway", 60.5, 8.5),
    "FINLANDIYA": ("Finland", 61.9, 25.7), "ITALYA": ("Italy", 41.9, 12.6), "ISPANYA": ("Spain", 40.5, -3.7),
    "ROMANYA": ("Romania", 45.9, 24.97), "MAKEDONYA": ("North Macedonia", 41.6, 21.7), "KOSOVA": ("Kosovo", 42.6, 20.9),
    "BOSNAHERSEK": ("Bosnia and Herzegovina", 43.9, 17.7), "ARNAVUTLUK": ("Albania", 41.2, 20.2),
    "UKRAYNA": ("Ukraine", 48.4, 31.2), "ERMENISTAN": ("Armenia", 40.1, 45.0), "SOMALI": ("Somalia", 5.2, 46.2),
    "YEMEN": ("Yemen", 15.6, 48.5), "SUDAN": ("Sudan", 12.9, 30.2), "KUVEYT": ("Kuwait", 29.3, 47.5),
    "BAE": ("United Arab Emirates", 23.4, 53.8), "KATAR": ("Qatar", 25.4, 51.2), "BAHREYN": ("Bahrain", 26.0, 50.6),
    "FILISTIN": ("Palestine", 31.9, 35.2), "GAZZE": ("Gaza", 31.4, 34.4), "MUSUL": ("Iraq (Mosul)", 36.3, 43.1),
    "HALEP": ("Syria (Aleppo)", 36.2, 37.2), "SAM": ("Syria (Damascus)", 33.5, 36.3), "KERKUK": ("Iraq (Kirkuk)", 35.5, 44.4),
    "ERBIL": ("Iraq (Erbil)", 36.2, 44.0), "HASEKE": ("Syria (Hasakah)", 36.5, 40.7), "KAMISLI": ("Syria (Qamishli)", 37.05, 41.2),
    "DUHOK": ("Iraq (Duhok)", 36.9, 43.0), "AFRIN": ("Syria (Afrin)", 36.5, 36.9), "KOBANI": ("Syria (Kobani)", 36.9, 38.4),
    "TAHRAN": ("Iran (Tehran)", 35.7, 51.4), "URMIYE": ("Iran (Urmia)", 37.55, 45.07), "BAKU": ("Azerbaijan (Baku)", 40.4, 49.9),
    "NAHCIVAN": ("Azerbaijan (Nakhchivan)", 39.2, 45.4), "TIFLIS": ("Georgia (Tbilisi)", 41.7, 44.8),
    "SUUDI": ("Saudi Arabia", 23.9, 45.1), "TATARISTAN": ("Tatarstan (Russia)", 55.8, 49.1), "INGUSETYA": ("Ingushetia (Russia)", 43.2, 44.9),
    "KABARDEYBALKAR": ("Kabardino-Balkaria (Russia)", 43.5, 43.4),
}


def fold(s: str) -> str:
    """Uppercase ASCII fold for Turkish place names (İ/ı/ş/ğ...) with non-letters removed."""
    s = (s or "").replace("İ", "I").replace("ı", "i")
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^A-Z]", "", s.upper())


def tr_title(word: str) -> str:
    out = []
    for w in re.split(r"(\s+|-)", word.strip()):
        if not w or w.isspace() or w == "-":
            out.append(w)
            continue
        first = w[0].replace("i", "İ").upper()
        rest = w[1:].replace("I", "ı").replace("İ", "i").lower()
        out.append(first + rest)
    return "".join(out)


def fetch_raw(cached: bool) -> dict:
    raw_path = SRC / "wanted_raw.json"
    if cached and raw_path.exists():
        return json.loads(raw_path.read_text(encoding="utf-8"))
    req = urllib.request.Request(ENDPOINT, data=b"{}", method="POST",
                                 headers={"Content-Type": "application/json",
                                          "User-Agent": "Mozilla/5.0 (wanted-atlas data build)"})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = json.loads(r.read().decode("utf-8"))
    raw_path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    return data


def build_gazetteer():
    cities = json.loads((SRC / "districts.json").read_text(encoding="utf-8"))
    provinces, districts = {}, {}
    for c in cities:
        pkey = PROVINCE_ALIASES.get(fold(c["name"]), fold(c["name"]))
        pname = "Afyon" if pkey == "AFYON" else c["name"]
        provinces[pkey] = (pname, c["latitude"], c["longitude"])
        for t in c.get("towns", []):
            districts.setdefault(fold(t["name"]), []).append((t["name"], pname, t["latitude"], t["longitude"]))
    return provinces, districts


def locate(place: str, provinces, districts):
    key = fold(place)
    if not key:
        return None
    if "/" in place:  # "NÜRNBERG/ALMANYA" -> try the country part first, then the town
        for part in reversed(place.split("/")):
            hit = locate(part, provinces, districts)
            if hit:
                return {**hit, "place": tr_title(place.replace("/", ", ")) if hit.get("abroad") else hit["place"]}
        return None
    key = DISTRICT_ALIASES.get(key, key)
    key = PROVINCE_ALIASES.get(key, key)
    if key in provinces:
        name, lat, lon = provinces[key]
        return {"place": name, "prov": name, "lat": lat, "lon": lon}
    if key in districts:
        hits = districts[key]
        if len({h[1] for h in hits}) == 1:
            dname, pname, lat, lon = hits[0]
            return {"place": f"{dname}, {pname}", "prov": pname, "lat": lat, "lon": lon}
        return {"place": tr_title(place), "prov": None, "ambiguous": sorted({h[1] for h in hits})}
    if key in COUNTRIES:
        name, lat, lon = COUNTRIES[key]
        return {"place": name, "prov": None, "abroad": True, "lat": lat, "lon": lon}
    return None


def build_provinces_svg():
    """Equirectangular projection with cos(39°) x-scaling, coordinates rounded, as SVG path strings."""
    gj = json.loads((SRC / "provinces.geojson").read_text(encoding="utf-8"))
    kx = math.cos(math.radians(39.0))
    lon0, lat0, scale = 25.6, 42.2, 60.0

    def proj(lon, lat):
        return round((lon - lon0) * kx * scale, 1), round((lat0 - lat) * scale, 1)

    out = []
    for f in gj["features"]:
        geom = f["geometry"]
        polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
        parts = []
        for poly in polys:
            for ring in poly:
                pts, last = [], None
                for lon, lat in ring:
                    p = proj(lon, lat)
                    if last is None or abs(p[0] - last[0]) + abs(p[1] - last[1]) >= 1.2:
                        pts.append(p)
                        last = p
                if len(pts) >= 3:
                    parts.append("M" + "L".join(f"{x:g},{y:g}" for x, y in pts) + "Z")
        out.append({"name": f["properties"]["name"], "d": "".join(parts)})
    meta = {"lon0": lon0, "lat0": lat0, "scale": scale, "kx": kx,
            "width": round((45.0 - lon0) * kx * scale), "height": round((lat0 - 35.7) * scale)}
    return {"meta": meta, "provinces": out}


def main():
    cached = "--cached" in sys.argv
    raw = fetch_raw(cached)
    provinces, districts = build_gazetteer()
    people, skipped, unmatched = [], Counter(), Counter()
    seen = set()
    for list_key, colour in LISTS.items():
        for p in raw.get(list_key, []):
            org = (p.get("TOrgutAdi") or "").strip()
            if org not in ORGS:
                skipped["org:" + org] += 1
                continue
            photo = (p.get("IlkGorselURL") or "").strip()
            if not photo or "profil-arananlar" in photo:  # site placeholder silhouette
                skipped["no photo"] += 1
                continue
            try:
                photos = ast.literal_eval(p.get("GorselURL") or "[]")
            except (ValueError, SyntaxError):
                photos = [photo]
            first, last = tr_title(p.get("Adi") or ""), (p.get("Soyadi") or "").strip()
            dedupe = (fold(first + last), photo)
            if dedupe in seen:
                skipped["duplicate"] += 1
                continue
            seen.add(dedupe)
            year = re.search(r"(19|20)\d\d", str(p.get("DogumTarihi") or ""))
            raw_place = (p.get("DogumYeri") or "").strip()
            loc = locate(raw_place, provinces, districts)
            if raw_place and loc is None:
                unmatched[raw_place.upper()] += 1
                loc = {"place": tr_title(raw_place), "prov": None}
            oid, oname, bucket = ORGS[org]
            people.append({
                "n": f"{first} {last}".strip(),
                "y": int(year.group(0)) if year else None,
                "b": loc,
                "img": [BASE + u for u in photos if isinstance(u, str) and u.startswith("/")] or [BASE + photo],
                "o": oid,
                "e": bucket,
                "l": colour,
            })
    for i, person in enumerate(people):
        person["id"] = i

    OUT.mkdir(parents=True, exist_ok=True)
    orgs_meta = {}
    for oid, oname, bucket in ORGS.values():
        orgs_meta[oid] = {"name": oname, "bucket": bucket, "count": sum(1 for x in people if x["o"] == oid)}
    payload = {"generated": dt.date.today().isoformat(), "source": BASE + "/tarananlar",
               "orgs": orgs_meta, "people": people}
    (OUT / "people.json").write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (OUT / "provinces.json").write_text(json.dumps(build_provinces_svg(), ensure_ascii=False, separators=(",", ":")),
                                         encoding="utf-8")

    located = sum(1 for x in people if x["b"] and x["b"].get("lat") is not None)
    print(f"people: {len(people)}  located on map: {located}  skipped: {dict(skipped)}")
    print("by easy bucket:", Counter(x["e"] for x in people))
    print("unmatched birthplaces (top 40):", unmatched.most_common(40))
    print("ambiguous:", sum(1 for x in people if x["b"] and x["b"].get("ambiguous")))
    print("unmatched total:", sum(unmatched.values()), "distinct:", len(unmatched))


if __name__ == "__main__":
    main()
