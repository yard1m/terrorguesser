#!/usr/bin/env python3
"""Project Natural Earth 110m countries (public domain) to one SVG path for the Global map clue."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
gj = json.loads((ROOT / "sources" / "ne_110m_countries.geojson").read_text(encoding="utf-8"))
LON0, LAT0, LAT1, S = -170.0, 84.0, -57.0, 2.6   # equirectangular crop (Antarctica dropped)
proj = lambda lon, lat: (round((lon - LON0) * S, 1), round((LAT0 - lat) * S, 1))
parts = []
for f in gj["features"]:
    g = f["geometry"]
    polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    for poly in polys:
        ring = poly[0]
        if max(p[1] for p in ring) < LAT1:
            continue
        pts, last = [], None
        for lon, lat in ring:
            p = proj(max(lon, LON0), lat)
            if last is None or abs(p[0] - last[0]) + abs(p[1] - last[1]) >= 1.0:
                pts.append(p); last = p
        if len(pts) >= 3:
            parts.append("M" + "L".join(f"{x:g},{y:g}" for x, y in pts) + "Z")
meta = {"lon0": LON0, "lat0": LAT0, "scale": S, "width": round((190 - LON0) * S), "height": round((LAT0 - LAT1) * S)}
out = ROOT / "public" / "data" / "world.json"
out.write_text(json.dumps({"meta": meta, "d": "".join(parts)}, separators=(",", ":")), encoding="utf-8")
print(meta, out.stat().st_size)
