#!/usr/bin/env python3
"""Download exact-dish photographs and write two crops.

Masthead files are 3:2. Card files are 4:3. Both are at least 1000 pixels
wide. The same focal point is centered in each crop. Sources under 1000
pixels, or with a license this site does not use, are left out.
"""

import json
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "dish-photos.json"
OUT = ROOT / "assets" / "photos" / "editorial"
CACHE = Path("/tmp/dish-photo-src")
SHARP = "/tmp/imgtools/node_modules/sharp"
UA = "KiteKitchen/1.0 (https://kitekitchen.com/; dish photographs; https://github.com/jonldavis-coder/flying-kitchen)"
MAST = (3, 2, 1500)
CARD = (4, 3, 1200)


def get(url, accept="*/*"):
    request = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read(), response.headers.get("Content-Type", "")


def commons_info(titles):
    found = {}
    for start in range(0, len(titles), 40):
        batch = titles[start:start + 40]
        params = {
            "action": "query",
            "titles": "|".join(batch),
            "prop": "imageinfo",
            "iiprop": "url|size|mime|extmetadata",
            "iiurlwidth": "2200",
            "format": "json",
        }
        url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
        raw, _ = get(url, "application/json")
        pages = json.loads(raw)["query"]["pages"]
        for page in pages.values():
            title = page.get("title") or ""
            info = (page.get("imageinfo") or [None])[0]
            found[title] = info
            found[title.replace(" ", "_")] = info
        time.sleep(0.2)
    return found


def license_ok(value):
    text = (value or "").strip().lower()
    if not text:
        return False
    if any(part in text for part in ("noncommercial", "non-commercial", "-nc", " nc", "noderiv", "no deriv", "-nd", " nd", "all rights reserved")):
        return False
    return any(part in text for part in ("cc0", "public domain", "cc by", "creative commons attribution", "pexels", "unsplash"))


def crop(image, ratio, focal, out_width):
    rw, rh, _ = ratio
    image = ImageOps.exif_transpose(image).convert("RGB")
    width, height = image.size
    target = rw / rh
    if width / height > target:
        crop_h = height
        crop_w = int(round(height * target))
    else:
        crop_w = width
        crop_h = int(round(width / target))
    if crop_w < 1000 or crop_h < 100:
        return None
    cx = float(focal[0]) * width
    cy = float(focal[1]) * height
    left = max(0, min(int(round(cx - crop_w / 2)), width - crop_w))
    top = max(0, min(int(round(cy - crop_h / 2)), height - crop_h))
    cropped = image.crop((left, top, left + crop_w, top + crop_h))
    if cropped.width > out_width:
        out_height = int(round(out_width * rh / rw))
        cropped = cropped.resize((out_width, out_height), Image.Resampling.LANCZOS)
    # Keep the ratio exact after rounding.
    exact_h = int(round(cropped.width * rh / rw))
    if exact_h != cropped.height:
        cropped = cropped.resize((cropped.width, exact_h), Image.Resampling.LANCZOS)
    if cropped.width < 1000:
        return None
    return cropped


def save_variants(image, dest_stem):
    jpg = dest_stem.with_suffix(".jpg")
    webp = dest_stem.with_suffix(".webp")
    avif = dest_stem.with_suffix(".avif")
    image.save(jpg, "JPEG", quality=82, optimize=True, progressive=True)
    image.save(webp, "WEBP", quality=74, method=6)
    script = (
        "import sharp from 'sharp';\n"
        "const [src, dest] = process.argv.slice(1);\n"
        "await sharp(src).avif({ quality: 48, effort: 4 }).toFile(dest);\n"
    )
    result = subprocess.run(["node", "--input-type=module", "-e", script, str(jpg), str(avif)], cwd="/tmp/imgtools", capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "avif encode failed")
    return jpg


def download_commons(info, dest):
    original = int(info.get("width") or 0)
    url = info.get("url") if original <= 5000 else (info.get("thumburl") or info.get("url"))
    if not url:
        raise RuntimeError("no download url")
    data, _ = get(url)
    dest.write_bytes(data)


def download_pexels(page_url, dest):
    import re
    match = re.search(r"(\d+)/?$", page_url.strip())
    if not match:
        raise RuntimeError("no pexels id")
    photo_id = match.group(1)
    url = f"https://images.pexels.com/photos/{photo_id}/pexels-photo-{photo_id}.jpeg?auto=compress&cs=tinysrgb&w=2000"
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept": "image/jpeg"})
    with urllib.request.urlopen(request, timeout=60) as response:
        dest.write_bytes(response.read())


def main():
    records = json.loads(DATA.read_text())
    only = set(sys.argv[1:])
    CACHE.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    commons = []
    for record in records:
        if only and record["id"] not in only and (record.get("slug") or "") not in only:
            continue
        title = record.get("commons") or ""
        if title.startswith("File:"):
            commons.append(title)
    info_by_title = commons_info(sorted(set(commons))) if commons else {}
    kept = []
    dropped = []
    seen_files = set()
    for record in records:
        selected = not only or record["id"] in only or (record.get("slug") or "") in only
        if not selected:
            kept.append(record)
            continue
        reason = None
        source_path = CACHE / f"{record['id']}.img"
        try:
            if record.get("source") == "Pexels":
                if not source_path.exists():
                    download_pexels(record["sourceUrl"], source_path)
                image = Image.open(source_path)
            elif record.get("source") == "Unsplash":
                if not source_path.exists():
                    download_commons({"url": record["download"]}, source_path) if record.get("download") else None
                    if not source_path.exists():
                        data, _ = get(record["download"])
                        source_path.write_bytes(data)
                image = Image.open(source_path)
            else:
                info = info_by_title.get(record.get("commons"))
                if not info:
                    reason = "commons file missing"
                else:
                    meta = info.get("extmetadata") or {}
                    license_name = ((meta.get("LicenseShortName") or {}).get("value") or record.get("license") or "")
                    if not license_ok(license_name):
                        reason = f"license {license_name}"
                    elif int(info.get("width") or 0) < 1000:
                        reason = f"source {info.get('width')}px"
                    elif not str(info.get("mime") or "").startswith("image/"):
                        reason = f"mime {info.get('mime')}"
                    else:
                        if not source_path.exists() or source_path.stat().st_size < 1000:
                            download_commons(info, source_path)
                        image = Image.open(source_path)
            if reason is None:
                focal = record.get("focal") or [0.5, 0.5]
                mast = crop(image, MAST, focal, MAST[2])
                card = crop(image, CARD, focal, CARD[2])
                if mast is None or card is None:
                    reason = "crop under 1000px"
                else:
                    if record["id"] not in seen_files:
                        save_variants(mast, OUT / f"{record['id']}-mast-{mast.width}")
                        save_variants(card, OUT / f"{record['id']}-card-{card.width}")
                        seen_files.add(record["id"])
                    record["mastWidth"] = mast.width
                    record["mastHeight"] = mast.height
                    record["cardWidth"] = card.width
                    record["cardHeight"] = card.height
                    record["focal"] = focal
        except Exception as error:
            reason = str(error)
        if reason:
            dropped.append({"id": record["id"], "slug": record.get("slug"), "reason": reason})
            print("drop", record["id"], reason)
        else:
            kept.append(record)
            print("keep", record["id"], record["mastWidth"], record["cardWidth"])
    if not only:
        DATA.write_text(json.dumps(kept, indent=2) + "\n")
        keep_names = set()
        for record in kept:
            for kind, width in (("mast", record["mastWidth"]), ("card", record["cardWidth"])):
                for ext in ("jpg", "webp", "avif"):
                    keep_names.add(f"{record['id']}-{kind}-{width}.{ext}")
        if not any(record.get("slug") for record in kept):
            raise SystemExit("No dish photographs were written. Leaving the photo directory unchanged.")
        removed = 0
        for path in OUT.iterdir():
            if path.is_file() and path.name not in keep_names:
                path.unlink()
                removed += 1
        print("removed old files", removed)
    else:
        # Merge dimension updates back for the selected ids.
        current = json.loads(DATA.read_text()) if DATA.exists() else []
        by_key = {(item.get("slug"), item["id"]): item for item in current}
        for record in kept:
            by_key[(record.get("slug"), record["id"])] = record
        DATA.write_text(json.dumps(list(by_key.values()), indent=2) + "\n")
    Path("/tmp/dish-photo-report.json").write_text(json.dumps({"kept": len(kept), "dropped": dropped}, indent=2))
    print("kept", len([item for item in kept if item.get("slug")]), "dropped", len(dropped))


if __name__ == "__main__":
    main()
