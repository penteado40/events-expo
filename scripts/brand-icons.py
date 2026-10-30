"""Renders the app icon W2, its dark version, the Android icons, the splash and the favicon.

The artwork is the Media kit's (canvas "events-expo · Design D", Marca). Run from the repo root,
with cairosvg installed: python3 scripts/brand-icons.py
"""

from pathlib import Path

import cairosvg

OUT = Path("assets/images")

BLUE_700 = "#1F4FAE"
BLUE_100 = "#DBE7FF"
CORAL_500 = "#EF5A3C"
PURPLE_500 = "#A06AEC"
GREEN_500 = "#1FB86A"
TURQUOISE_500 = "#069FA6"
DARK_BG = "#0E1320"


def timeline(line: str, hollow: str) -> str:
    """The W2 timeline on a 24 grid: blue line, coral dot of what changed, items in Event tones."""
    return f"""
<path d="M6.5 4v16" stroke="{line}" stroke-width="2.2"/>
<circle cx="6.5" cy="7" r="2.3" fill="{CORAL_500}"/>
<circle cx="6.5" cy="13" r="2.3" fill="{line}"/>
<circle cx="6.5" cy="19" r="1.9" fill="{hollow}" stroke="{line}" stroke-width="1.6"/>
<path d="M11 7h8" stroke="{PURPLE_500}" stroke-width="2.8"/>
<path d="M11 13h5.5" stroke="{GREEN_500}" stroke-width="2.8"/>
<path d="M11 19h7" stroke="{TURQUOISE_500}" stroke-width="2.8"/>"""


def signature() -> str:
    """The smaller mark (Assinatura, splash): bolder strokes, no hollow last dot."""
    return f"""
<path d="M6.5 4v16" stroke="{BLUE_700}" stroke-width="2.4"/>
<circle cx="6.5" cy="7" r="2.4" fill="{CORAL_500}"/>
<circle cx="6.5" cy="13" r="2.4" fill="{BLUE_700}"/>
<path d="M11 7h8" stroke="{PURPLE_500}" stroke-width="3"/>
<path d="M11 13h5.5" stroke="{GREEN_500}" stroke-width="3"/>
<path d="M11 19h7" stroke="{TURQUOISE_500}" stroke-width="3"/>"""


def svg(size: int, body: str, *, background: str | None = None, glyph: float, radius: float = 0) -> str:
    """A square canvas of `size` with the 24-grid `body` centered at `glyph` of its width."""
    scale = size * glyph / 24
    offset = (size - 24 * scale) / 2
    rect = (
        f'<rect width="{size}" height="{size}" rx="{size * radius}" fill="{background}"/>'
        if background
        else ""
    )
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">
{rect}
<g transform="translate({offset} {offset}) scale({scale})" fill="none" stroke-linecap="round">{body}</g>
</svg>"""


def write(name: str, content: str, size: int) -> None:
    cairosvg.svg2png(bytestring=content.encode(), write_to=str(OUT / name), output_width=size)


# The kit's icon: a 140 px glyph on a 220 px card. iOS and Android round the corners themselves.
ICON_GLYPH = 140 / 220
write("icon.png", svg(1024, timeline(BLUE_700, "#FFFFFF"), background="#FFFFFF", glyph=ICON_GLYPH), 1024)
write("icon-dark.png", svg(1024, timeline(BLUE_100, DARK_BG), background=DARK_BG, glyph=ICON_GLYPH), 1024)
# Android adaptive icon: the glyph alone, inside the 66% safe zone; the background is a color.
ANDROID_GLYPH = ICON_GLYPH * 0.66
write("android-icon-foreground.png", svg(1024, timeline(BLUE_700, "#FFFFFF"), glyph=ANDROID_GLYPH), 1024)
write("android-icon-monochrome.png", svg(1024, timeline("#000000", "#FFFFFF"), glyph=ANDROID_GLYPH), 1024)
# Splash: the white card of the mark (36 px glyph on a 56 px card, radius 16).
write("splash-icon.png", svg(1024, signature(), background="#FFFFFF", glyph=36 / 56, radius=16 / 56), 1024)
write("favicon.png", svg(48, timeline(BLUE_700, "#FFFFFF"), background="#FFFFFF", glyph=ICON_GLYPH, radius=0.22), 48)
