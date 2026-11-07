#!/usr/bin/env python3
"""Original Flying Kitchen images from the supplied logo. Mockups are drawings, not product photos."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SRC = Path("/home/ubuntu/.cursor/projects/workspace/uploads/flying-kitchen-logo_f682.jpg")
OUT = ROOT / "assets" / "images"
GEAR = OUT / "gear"

NAVY = (2, 45, 90)
NAVY_DEEP = (1, 30, 61)
EMBER = (214, 80, 9)
GOLD = (229, 166, 53)
CREAM = (255, 249, 233)
PAPER = (255, 252, 244)
WOOD = (176, 122, 68)
WOOD_DARK = (120, 78, 40)
IRON = (36, 40, 46)
IRON_LIGHT = (88, 94, 102)

SERIF = "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"
SERIF_REG = "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"
SANS = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"


def font(path, size):
    return ImageFont.truetype(path, size)


def circle_logo(logo, size):
    im = logo.convert("RGBA").resize((size, size), Image.Resampling.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((1, 1, size - 2, size - 2), fill=255)
    im.putalpha(mask)
    return im


def balloon_mark(logo):
    # Balloon, basket, and skillet. Tongs and the spatula stay outside the crop.
    crop = logo.crop((378, 72, 692, 548))
    side = max(crop.size)
    canvas = Image.new("RGB", (side, side), CREAM)
    ox = (side - crop.size[0]) // 2
    oy = (side - crop.size[1]) // 2
    canvas.paste(crop, (ox, oy))
    return canvas


def paste(base, sprite, center):
    x = int(center[0] - sprite.size[0] / 2)
    y = int(center[1] - sprite.size[1] / 2)
    base.paste(sprite, (x, y), sprite)


def new_plate():
    im = Image.new("RGB", (1600, 1600), CREAM)
    draw = ImageDraw.Draw(im)
    draw.rectangle((28, 28, 1571, 1571), outline=NAVY, width=22)
    draw.rectangle((64, 64, 1535, 1535), outline=GOLD, width=8)
    return im, draw


def caption(draw, text):
    f = font(SANS, 36)
    draw.text((96, 1488), text, font=f, fill=NAVY)


def finish(im):
    return im.resize((1100, 1100), Image.Resampling.LANCZOS)


def shadow(draw, box, tone=(2, 45, 90)):
    draw.ellipse(box, fill=(230, 214, 184))


def apron(logo):
    im, d = new_plate()
    shadow(d, (430, 1280, 1180, 1400))
    d.polygon([(690, 250), (760, 430), (700, 470), (640, 430)], fill=NAVY)
    d.polygon([(910, 250), (960, 430), (900, 470), (840, 430)], fill=NAVY)
    d.polygon([(640, 430), (960, 430), (1020, 760), (580, 760)], fill=PAPER, outline=NAVY)
    d.line([(640, 430), (960, 430), (1020, 760), (580, 760), (640, 430)], fill=NAVY, width=10)
    d.polygon([(520, 760), (1080, 760), (1160, 1320), (440, 1320)], fill=PAPER)
    d.line([(520, 760), (1080, 760), (1160, 1320), (440, 1320), (520, 760)], fill=NAVY, width=10)
    d.rectangle((560, 760, 1040, 860), fill=EMBER)
    d.rounded_rectangle((610, 980, 990, 1220), radius=30, outline=NAVY, width=8)
    paste(im, circle_logo(logo, 250), (800, 590))
    caption(d, "Original mockup  ·  not a finished product")
    return finish(im)


def tools(logo):
    im, d = new_plate()
    d.rounded_rectangle((180, 240, 1420, 1360), radius=48, fill=PAPER, outline=NAVY, width=10)
    paste(im, circle_logo(logo, 200), (800, 420))
    d.rounded_rectangle((340, 620, 430, 1120), radius=24, fill=NAVY)
    for x in (310, 370, 430):
        d.rounded_rectangle((x, 1080, x + 48, 1280), radius=14, fill=IRON)
    d.rounded_rectangle((620, 620, 710, 1180), radius=28, fill=NAVY)
    d.rounded_rectangle((780, 620, 870, 1180), radius=28, fill=NAVY)
    d.rounded_rectangle((600, 1120, 730, 1280), radius=18, fill=EMBER)
    d.rounded_rectangle((760, 1120, 890, 1280), radius=18, fill=EMBER)
    d.rounded_rectangle((1080, 620, 1180, 1040), radius=24, fill=NAVY)
    d.rounded_rectangle((1000, 1000, 1280, 1280), radius=36, fill=GOLD, outline=NAVY, width=8)
    for y in (1080, 1160, 1240):
        d.rectangle((1040, y, 1240, y + 22), fill=CREAM)
    caption(d, "Original mockup  ·  not a finished product")
    return finish(im)


def board(logo):
    im, d = new_plate()
    d.rounded_rectangle((280, 300, 1320, 1320), radius=70, fill=WOOD, outline=WOOD_DARK, width=16)
    d.rounded_rectangle((360, 380, 1240, 1240), radius=40, outline=GOLD, width=10)
    d.ellipse((720, 1160, 880, 1240), fill=WOOD_DARK)
    paste(im, circle_logo(logo, 360), (800, 760))
    caption(d, "Original mockup  ·  not a finished product")
    return finish(im)


def skillet(logo):
    im, d = new_plate()
    shadow(d, (360, 1180, 1240, 1320))
    d.polygon([(1120, 700), (1480, 560), (1520, 640), (1160, 790)], fill=NAVY)
    d.ellipse((1120, 620, 1280, 760), outline=GOLD, width=10)
    d.ellipse((300, 460, 1180, 1240), fill=IRON, outline=NAVY, width=18)
    d.ellipse((400, 560, 1080, 1140), fill=(22, 24, 28))
    paste(im, circle_logo(logo, 280), (740, 850))
    caption(d, "Original mockup  ·  not a finished product")
    return finish(im)


def tin(logo):
    im, d = new_plate()
    d.ellipse((340, 980, 1260, 1220), fill=GOLD, outline=NAVY, width=8)
    d.rectangle((340, 620, 1260, 1100), fill=NAVY)
    d.ellipse((340, 500, 1260, 780), fill=GOLD, outline=NAVY, width=10)
    d.ellipse((430, 560, 1170, 800), fill=NAVY)
    paste(im, circle_logo(logo, 300), (800, 680))
    caption(d, "Original mockup  ·  not a finished product")
    return finish(im)


def thermometer(logo):
    im, d = new_plate()
    d.rounded_rectangle((980, 300, 1080, 1180), radius=40, fill=IRON)
    d.polygon([(980, 1080), (1080, 1080), (1120, 1280), (940, 1280)], fill=EMBER)
    d.ellipse((620, 480, 1100, 960), fill=PAPER, outline=NAVY, width=16)
    d.ellipse((760, 620, 960, 820), fill=GOLD, outline=NAVY, width=8)
    d.line([(860, 720), (1040, 520)], fill=EMBER, width=10)
    paste(im, circle_logo(logo, 200), (760, 1180))
    caption(d, "Original mockup  ·  not a finished product")
    return finish(im)


def gloves(logo):
    im, d = new_plate()
    def mitt(dx):
        d.rounded_rectangle((280 + dx, 520, 760 + dx, 1280), radius=90, fill=NAVY)
        d.rounded_rectangle((300 + dx, 980, 740 + dx, 1260), radius=70, fill=EMBER)
        d.rounded_rectangle((330 + dx, 280, 450 + dx, 620), radius=40, fill=NAVY)
        d.rounded_rectangle((470 + dx, 220, 590 + dx, 600), radius=40, fill=NAVY)
        d.rounded_rectangle((610 + dx, 280, 730 + dx, 600), radius=40, fill=NAVY)
        paste(im, circle_logo(logo, 150), (520 + dx, 760))
    mitt(0)
    mitt(520)
    caption(d, "Original mockup  ·  not a finished product")
    return finish(im)


def branding_iron(logo, mark):
    im, d = new_plate()
    d.polygon([(180, 980), (980, 700), (1020, 780), (220, 1060)], fill=NAVY)
    d.rounded_rectangle((160, 900, 320, 1100), radius=20, fill=EMBER)
    d.rounded_rectangle((980, 520, 1380, 920), radius=24, fill=IRON, outline=NAVY, width=10)
    mark_img = circle_logo(mark.convert("RGB"), 280)
    paste(im, mark_img, (1180, 720))
    caption(d, "Original mockup  ·  not a finished product")
    return finish(im)


def tumbler(logo):
    im, d = new_plate()
    d.ellipse((520, 260, 1080, 420), fill=GOLD, outline=NAVY, width=8)
    d.polygon([(560, 360), (1040, 360), (980, 1280), (620, 1280)], fill=NAVY)
    d.ellipse((620, 1200, 980, 1340), fill=NAVY_DEEP)
    d.rounded_rectangle((700, 470, 900, 560), radius=12, fill=GOLD)
    paste(im, circle_logo(logo, 280), (800, 860))
    caption(d, "Original mockup  ·  not a finished product")
    return finish(im)


def hat(logo):
    im, d = new_plate()
    # Crown first, then the brim overlaps its lower edge so the cap reads as one piece.
    d.pieslice((430, 220, 1170, 1580), 180, 360, fill=NAVY)
    d.ellipse((200, 780, 1400, 1180), fill=NAVY)
    d.pieslice((560, 520, 1040, 1180), 200, 340, fill=NAVY_DEEP)
    paste(im, circle_logo(logo, 230), (800, 700))
    caption(d, "Original mockup  ·  not a finished product")
    return finish(im)


def library(logo):
    im, d = new_plate()
    d.rounded_rectangle((240, 980, 1360, 1320), radius=16, fill=NAVY)
    spines = [(340, EMBER), (520, NAVY), (700, GOLD), (880, NAVY), (1060, EMBER)]
    for x, color in spines:
        d.rectangle((x, 420, x + 150, 1100), fill=color, outline=NAVY_DEEP, width=6)
        d.rectangle((x + 24, 500, x + 126, 540), fill=CREAM)
    paste(im, circle_logo(logo, 260), (800, 820))
    caption(d, "Original mockup  ·  not a finished product")
    return finish(im)


def og_image(logo):
    im = Image.new("RGB", (1200, 630), CREAM)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 1199, 629), outline=GOLD, width=16)
    d.rectangle((20, 20, 1179, 609), outline=NAVY, width=4)
    paste(im, circle_logo(logo, 520), (330, 315))
    d.text((620, 210), "Flying Kitchen", font=font(SERIF, 68), fill=NAVY)
    d.text((620, 300), "Taste the world", font=font(SERIF_REG, 36), fill=EMBER)
    d.rectangle((620, 370, 860, 378), fill=GOLD)
    d.text((620, 400), "The flagship hub", font=font(SANS, 28), fill=NAVY)
    return im


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    GEAR.mkdir(parents=True, exist_ok=True)
    logo = Image.open(SRC).convert("RGB")
    logo.resize((800, 800), Image.Resampling.LANCZOS).save(OUT / "logo.jpg", quality=88, optimize=True)
    mark = balloon_mark(logo)
    mark.resize((512, 512), Image.Resampling.LANCZOS).save(OUT / "mark.jpg", quality=90, optimize=True)
    icon = mark.resize((64, 64), Image.Resampling.LANCZOS)
    icon.save(OUT / "favicon.png")
    mark.resize((180, 180), Image.Resampling.LANCZOS).save(OUT / "apple-touch.png")
    icon.save(ROOT / "favicon.ico", sizes=[(32, 32), (48, 48), (64, 64)])
    og_image(logo).save(OUT / "og.jpg", quality=88, optimize=True)

    plates = {
        "apron": apron(logo),
        "grill-tools": tools(logo),
        "cutting-board": board(logo),
        "skillet": skillet(logo),
        "spice-tin": tin(logo),
        "thermometer": thermometer(logo),
        "grill-gloves": gloves(logo),
        "branding-iron": branding_iron(logo, mark),
        "tumbler": tumbler(logo),
        "hat": hat(logo),
        "ultimate-library": library(logo),
    }
    for name, image in plates.items():
        path = GEAR / f"{name}.jpg"
        image.save(path, quality=86, optimize=True)
        print(path, image.size)


if __name__ == "__main__":
    main()
