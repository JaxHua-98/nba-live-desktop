from __future__ import annotations

import base64
import io
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw


ROOT = Path(__file__).resolve().parent.parent
SOURCE = (
    Path(sys.argv[1])
    if len(sys.argv) > 1
    else ROOT / "build" / "icon-source.png"
)
PNG_PATH = ROOT / "build" / "icon.png"
SVG_PATH = ROOT / "build" / "icon.svg"
DARK_PREVIEW_PATH = ROOT / "work" / "icon-on-dark.png"


if not SOURCE.exists():
    raise SystemExit("请提供有效的 Logo 图片路径")

image = Image.open(SOURCE).convert("RGBA")

# Locate the colored app-icon silhouette against the supplied white canvas.
difference = ImageChops.difference(
    image.convert("RGB"), Image.new("RGB", image.size, "white")
).convert("L")
silhouette = difference.point(lambda value: 255 if value > 40 else 0)
bounds = silhouette.getbbox()
if bounds is None:
    raise SystemExit("未能从图片中识别出 Logo 边界")

image = image.crop(bounds).resize((960, 960), Image.Resampling.LANCZOS)

# Replace the noisy white outer canvas with a clean, anti-aliased app-icon mask.
mask_scale = 4
mask = Image.new("L", (960 * mask_scale, 960 * mask_scale), 0)
ImageDraw.Draw(mask).rounded_rectangle(
    (0, 0, mask.width - 1, mask.height - 1),
    radius=198 * mask_scale,
    fill=255,
)
mask = mask.resize((960, 960), Image.Resampling.LANCZOS)
image.putalpha(mask)

icon = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
icon.alpha_composite(image, (32, 32))
image = icon
image.save(PNG_PATH, format="PNG", optimize=True)

png_buffer = io.BytesIO()
image.save(png_buffer, format="PNG", optimize=True)
encoded = base64.b64encode(png_buffer.getvalue()).decode("ascii")
SVG_PATH.write_text(
    (
        '<svg xmlns="http://www.w3.org/2000/svg" '
        'width="1024" height="1024" viewBox="0 0 1024 1024">\n'
        f'  <image width="1024" height="1024" href="data:image/png;base64,{encoded}"/>\n'
        "</svg>\n"
    ),
    encoding="utf-8",
)

preview = Image.new("RGBA", (1152, 1152), "#102a4f")
preview.alpha_composite(image, (64, 64))
preview.save(DARK_PREVIEW_PATH, format="PNG")

alpha = image.getchannel("A")
transparent = sum(1 for value in alpha.getdata() if value == 0)
print(
    f"Logo prepared: {PNG_PATH} ({image.width}x{image.height}), "
    f"transparent pixels: {transparent}, preview: {DARK_PREVIEW_PATH}"
)
