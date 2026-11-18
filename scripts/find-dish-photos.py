#!/usr/bin/env python3
"""Search Wikimedia Commons for exact-dish candidates. Writes thumbs for review."""

import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

UA = "KiteKitchen/1.0 (https://kitekitchen.com/; dish photographs; https://github.com/jonldavis-coder/flying-kitchen)"
OUT = Path("/tmp/dish-candidates")


def get(url):
    request = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def license_ok(value):
    text = (value or "").strip().lower()
    if not text:
        return False
    if any(part in text for part in ("noncommercial", "non-commercial", "-nc", " nc", "-nd", " nd", "all rights reserved")):
        return False
    return any(part in text for part in ("cc0", "public domain", "cc by", "creative commons attribution"))


def search(query):
    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": f"{query} filetype:bitmap",
        "gsrnamespace": "6",
        "gsrlimit": "8",
        "prop": "imageinfo",
        "iiprop": "url|size|mime|extmetadata",
        "iiurlwidth": "480",
        "format": "json",
    }
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    body = json.loads(get(url))
    pages = (body.get("query") or {}).get("pages") or {}
    hits = []
    for page in pages.values():
        info = (page.get("imageinfo") or [None])[0]
        if not info:
            continue
        meta = info.get("extmetadata") or {}
        license_name = (meta.get("LicenseShortName") or {}).get("value") or ""
        artist = (meta.get("Artist") or {}).get("value") or ""
        width = int(info.get("width") or 0)
        mime = info.get("mime") or ""
        if width < 1000 or not mime.startswith("image/") or mime == "image/gif" or not license_ok(license_name):
            continue
        title = page.get("title") or ""
        hits.append({
            "title": title,
            "width": width,
            "height": int(info.get("height") or 0),
            "license": license_name,
            "licenseUrl": (meta.get("LicenseUrl") or {}).get("value") or "",
            "artist": artist,
            "thumb": info.get("thumburl") or "",
            "page": "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(title.replace(" ", "_")),
            "description": ((meta.get("ImageDescription") or {}).get("value") or "")[:240],
        })
    hits.sort(key=lambda item: item["width"], reverse=True)
    return hits[:5]


def main():
    rows = Path("/tmp/missing-recipes.txt").read_text().splitlines()
    wanted = []
    for line in rows:
        count, slug, title, href = line.split("\t")
        section = "pancake" if "/pancakes/" in href else "bbq" if "/dishes/" in href else "sauce"
        wanted.append((int(count), section, slug, title))
    # Highest linked sauces, then the highest linked pancakes and barbecue dishes.
    sauces = [row for row in wanted if row[1] == "sauce"][:36]
    pancakes = [row for row in wanted if row[1] == "pancake"][:18]
    bbq = [row for row in wanted if row[1] == "bbq"][:18]
    chosen = sauces + pancakes + bbq
    OUT.mkdir(parents=True, exist_ok=True)
    catalog = []
    for count, section, slug, title in chosen:
        try:
            hits = search(title)
        except Exception as error:
            print("fail", slug, error)
            hits = []
        print(f"{count:4} {slug} {len(hits)}")
        for index, hit in enumerate(hits):
            thumb = OUT / f"{slug}-{index}.jpg"
            if hit["thumb"] and not thumb.exists():
                try:
                    request = urllib.request.Request(hit["thumb"], headers={"User-Agent": UA})
                    with urllib.request.urlopen(request, timeout=60) as response:
                        thumb.write_bytes(response.read())
                    hit["thumbFile"] = str(thumb)
                except Exception as error:
                    hit["thumbError"] = str(error)
            elif thumb.exists():
                hit["thumbFile"] = str(thumb)
            hit["index"] = index
        catalog.append({"slug": slug, "title": title, "section": section, "links": count, "hits": hits})
        time.sleep(0.25)
    Path("/tmp/dish-candidates.json").write_text(json.dumps(catalog, indent=2))
    print("dishes", len(catalog), "hits", sum(len(item["hits"]) for item in catalog))


if __name__ == "__main__":
    main()
