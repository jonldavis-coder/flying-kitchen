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


def graticule(draw, lat, lon, box):
    x0, y0, w, h = box
    draw.rectangle((x0, y0, x0 + w, y0 + h), fill=(244, 240, 232), outline=GOLD, width=2)
    for i in range(1, 4):
        draw.line((x0, y0 + h * i / 4, x0 + w, y0 + h * i / 4), fill=(228, 221, 210), width=1)
        draw.line((x0 + w * i / 4, y0, x0 + w * i / 4, y0 + h), fill=(228, 221, 210), width=1)
    if lat is None or lon is None:
        cx, cy = x0 + w / 2, y0 + h / 2
    else:
        cx = x0 + ((float(lon) + 180) / 360) * w
        cy = y0 + ((90 - float(lat)) / 180) * h
    r = 8
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(226, 176, 7), outline=INK, width=2)


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
        draw.rectangle((688, 78, 1152, 552), outline=GOLD, width=2)
    else:
        graticule(draw, job.get("lat"), job.get("lon"), (820, 180, 280, 160))
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
