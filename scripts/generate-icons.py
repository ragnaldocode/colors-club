#!/usr/bin/env python3
"""Gera os ícones do Colors Club a partir da paleta do app (sem assets externos).

Uso: python3 scripts/generate-icons.py
Requer Pillow (instale num venv de scratch, não no python do sistema).
"""
from __future__ import annotations

import math
import os

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "images")

CREAM = (255, 247, 240, 255)
CORAL = (255, 111, 91, 255)
CORAL_DARK = (195, 68, 50, 255)
BUTTER = (255, 201, 60, 255)
BUTTER_SOFT = (255, 243, 209, 255)
INK = (46, 36, 64, 255)
TEAL = (63, 184, 175, 255)
BLUE = (78, 110, 242, 255)
PINK = (242, 109, 156, 255)


def star_points(cx: float, cy: float, outer: float, inner: float, points: int = 5):
    coords = []
    for index in range(points * 2):
        angle = -math.pi / 2 + index * math.pi / points
        radius = outer if index % 2 == 0 else inner
        coords.append((cx + math.cos(angle) * radius, cy + math.sin(angle) * radius))
    return coords


def draw_motif(image: Image.Image, scale: float = 1.0) -> None:
    draw = ImageDraw.Draw(image, "RGBA")
    size = image.size[0]
    center = size / 2
    unit = size / 1024 * scale

    draw.ellipse(
        [center - 360 * unit, center - 360 * unit, center + 360 * unit, center + 360 * unit],
        fill=CORAL,
        outline=CORAL_DARK,
        width=max(2, int(14 * unit)),
    )
    draw.ellipse(
        [center - 268 * unit, center - 268 * unit, center + 268 * unit, center + 268 * unit],
        fill=BUTTER_SOFT,
    )
    draw.polygon(star_points(center, center - 10 * unit, 190 * unit, 80 * unit), fill=BUTTER, outline=INK)

    # olhinhos e sorriso: o mesmo carisma da Lumi
    eye = 26 * unit
    for dx in (-58, 58):
        draw.ellipse(
            [center + dx * unit - eye, center - 60 * unit - eye, center + dx * unit + eye, center - 60 * unit + eye],
            fill=INK,
        )
    draw.arc(
        [center - 74 * unit, center - 60 * unit, center + 74 * unit, center + 90 * unit],
        start=20,
        end=160,
        fill=INK,
        width=max(3, int(16 * unit)),
    )

    for angle, color in (
        (math.pi * 0.25, TEAL),
        (math.pi * 0.75, BLUE),
        (math.pi * 1.25, PINK),
        (math.pi * 1.75, BUTTER),
    ):
        x = center + math.cos(angle) * 420 * unit
        y = center + math.sin(angle) * 420 * unit
        radius = 40 * unit
        draw.ellipse([x - radius, y - radius, x + radius, y + radius], fill=color, outline=INK, width=max(2, int(8 * unit)))


def save(image: Image.Image, name: str) -> None:
    path = os.path.join(OUT, name)
    image.save(path, "PNG")
    print(f"  {name} {image.size[0]}x{image.size[1]}")


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    print("gerando ícones:")

    icon = Image.new("RGBA", (1024, 1024), CREAM)
    draw_motif(icon)
    save(icon, "icon.png")

    # Android adaptive: só o motivo, com margem de segurança, fundo transparente.
    adaptive = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw_motif(adaptive, scale=0.62)
    save(adaptive, "adaptive-icon.png")

    splash = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw_motif(splash, scale=0.8)
    save(splash, "splash-icon.png")

    favicon = Image.new("RGBA", (96, 96), CREAM)
    draw_motif(favicon, scale=1.0)
    save(favicon, "favicon.png")


if __name__ == "__main__":
    main()
