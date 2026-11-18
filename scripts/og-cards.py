#!/usr/bin/env python3
"""Draw branded Open Graph cards. Reads a JSON list of jobs from argv[1]."""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SERIF = "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"
SERIF_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"
W, H = 1200, 630
INK = (26, 26, 26)
GOLD = (198, 161, 91)
PAPER = (246, 241, 230)
MUTED = (90, 78, 62)


def font(size, bold=False):
    return ImageFont.truetype(SERIF_BOLD if bold else SERIF, size)


def wrap(draw, text, face, width):
    words = (text or "").split()
    lines, line = [], ""
    for word in words:
        trial = f"{line} {word}".strip()
        if draw.textlength(trial, font=face) <= width and line:
            line = trial
        elif draw.textlength(word, font=face) <= width:
            if line:
                lines.append(line)
            line = word
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def kite(draw, x, y, scale=1.0):
    def p(px, py):
        return (x + px * scale, y + py * scale)
    draw.polygon([p(32, 4), p(57, 30), p(32, 51), p(7, 30)], fill=GOLD)
    draw.polygon([p(32, 12), p(48, 30), p(32, 44), p(16, 30)], fill=(246, 231, 193))
    draw.line([p(32, 4), p(32, 51)], fill=(92, 61, 18), width=max(1, int(1.2 * scale)))
    draw.line([p(7, 30), p(57, 30)], fill=(92, 61, 18), width=max(1, int(1.2 * scale)))


def cover(photo_path, box):
    im = Image.open(ROOT / photo_path).convert("RGB")
    tw, th = box
    scale = max(tw / im.width, th / im.height)
    nw, nh = int(im.width * scale), int(im.height * scale)
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left, top = (nw - tw) // 2, (nh - th) // 2
    return im.crop((left, top, left + tw, top + th))


LANDS = [
    "M5.3 11.1 12.9 8.9 23.1 8.9 33.3 7.1 40.9 7.6 48.9 9.8 55.1 16.4 50.7 20.4 46.7 24.4 44 28.9 40 32.9 36.9 32.9 32.9 30.2 30.2 28.4 28 25.8 24.9 22.2 24.4 18.2 19.6 14.7 12.4 13.8 6.2 13.3",
    "M44.4 35.6 48.9 34.7 53.3 36.4 57.8 39.1 64.4 42.2 62.7 49.8 58.7 52.4 52.4 63.1 48 63.1 46.2 57.8 44.4 43.6 45.3 37.3",
    "M75.6 24 76 20.9 76.4 14.2 80 12.4 83.6 11.6 88.9 8.9 92.4 8.4 94.2 13.3 92.4 19.6 88 22.2 83.6 23.6 77.8 24",
    "M72.4 30.7 72.9 27.6 74.7 24.4 80 23.6 84.4 23.6 91.1 25.8 94.2 26.2 99.1 34.7 102.7 35.1 98.7 47.1 95.6 51.6 88.9 55.6 85.3 48 83.6 38.2 77.3 37.8 73.8 33.8",
    "M97.8 15.6 101.3 8.9 115.6 7.1 133.3 7.6 151.1 9.8 159.1 10.7 154.7 13.3 148.9 17.8 143.1 21.3 137.8 25.8 134.2 30.2 128.4 36.4 126.2 39.6 122.2 32.9 115.6 37.3 110.2 29.8 106.7 28.4 101.3 22.2 98.7 17.8",
    "M130.7 49.8 136.9 45.8 143.1 44.9 144.9 48 148 51.6 146.7 56.9 140.4 55.6 135.1 54.7 130.7 55.1 130.2 51.6",
]


def path_points(path):
    nums = [float(n) for n in __import__("re").findall(r"-?\d+(?:\.\d+)?", path)]
    return list(zip(nums[0::2], nums[1::2]))


def atlas_plate(lat, lon):
    w, h = 460, 470
    plate = Image.new("RGB", (w, h), (244, 240, 232))
    pen = ImageDraw.Draw(plate)
    pen.rectangle((10, 10, w - 11, h - 11), outline=GOLD, width=3)
    pen.rectangle((18, 18, w - 19, h - 19), outline=GOLD, width=1)
    mx, my, mw, mh = 40, 46, 380, 300
    for i in range(1, 4):
        pen.line((mx, my + mh * i / 4, mx + mw, my + mh * i / 4), fill=(228, 221, 210), width=1)
        pen.line((mx + mw * i / 4, my, mx + mw * i / 4, my + mh), fill=(228, 221, 210), width=1)
    scale = min(mw / 160, mh / 80)
    ox = mx + (mw - 160 * scale) / 2
    oy = my + (mh - 80 * scale) / 2
    for land in LANDS:
        pen.polygon([(ox + x * scale, oy + y * scale) for x, y in path_points(land)], fill=(234, 215, 174), outline=INK)
    if lat is not None and lon is not None:
        cx = ox + ((float(lon) + 180) / 360) * 160 * scale
        cy = oy + ((90 - float(lat)) / 180) * 80 * scale
        r = 9
        pen.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(226, 176, 7), outline=(255, 253, 251), width=3)
        pen.ellipse((cx - r, cy - r, cx + r, cy + r), outline=INK, width=1)
    pen.text((40, 400), "Atlas plate", font=font(22), fill=INK)
    return plate


def draw_card(job):
    im = Image.new("RGB", (W, H), PAPER)
    draw = ImageDraw.Draw(im)
    draw.rectangle((16, 16, W - 17, H - 17), outline=GOLD, width=3)
    draw.rectangle((26, 26, W - 27, H - 27), outline=GOLD, width=1)
    photo = job.get("photo") or ""
    has_photo = bool(photo) and (ROOT / photo).exists()
    text_w = 560 if has_photo else 760
    x = 64
    kicker = (job.get("kicker") or "Kite Kitchen").upper()
    draw.text((x, 58), kicker, font=font(22), fill=GOLD)
    draw.line((x, 96, x + 150, 96), fill=GOLD, width=2)
    title_face = font(58 if len(job.get("title") or "") < 28 else 46, bold=True)
    lines = wrap(draw, job.get("title") or "Kite Kitchen", title_face, text_w)[:4]
    y = 120
    for line in lines:
        draw.text((x, y), line, font=title_face, fill=INK)
        y += int(title_face.size * 1.15)
    sub = job.get("line") or ""
    if sub:
        sub_face = font(26)
        for line in wrap(draw, sub, sub_face, text_w)[:2]:
            draw.text((x, y + 16), line, font=sub_face, fill=MUTED)
            y += 36
    kite(draw, 56, 520, 0.85)
    draw.text((120, 548), "Kite Kitchen", font=font(28), fill=INK)
    if has_photo:
        frame = cover(photo, (460, 470))
        im.paste(frame, (690, 80))
    else:
        im.paste(atlas_plate(job.get("lat"), job.get("lon")), (690, 80))
    draw.rectangle((688, 78, 1152, 552), outline=GOLD, width=2)
    out = ROOT / job["out"]
    out.parent.mkdir(parents=True, exist_ok=True)
    im.save(out, "JPEG", quality=68, optimize=True, progressive=True)


def main():
    jobs = json.loads(Path(sys.argv[1]).read_text())
    for job in jobs:
        draw_card(job)
    print(f"og cards {len(jobs)}")


if __name__ == "__main__":
    main()
