"""
Generate AiStudio app icons from the CG Shortcuts AI/PDF logo.

Source of truth for the fork brand mark. Run from repo root or this folder:

  python web/src/custom/branding/assets/generate_icons.py

Writes masters here, then copies sized assets into web/public and electron/.
"""
from __future__ import annotations

import os
import shutil
import struct
import zlib
from pathlib import Path

import fitz
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
# assets -> branding -> custom -> src -> web -> repo
REPO = HERE.parents[4]
DEFAULT_SOURCE = Path(r"C:\Users\Dave\Downloads\cgshortcuts-ai-logo.ai")
LOCAL_SOURCE = HERE / "cgshortcuts-ai-logo.ai"

WEB_PUBLIC = REPO / "web" / "public"
ELECTRON_RESOURCES = REPO / "electron" / "resources"
ELECTRON_LINUX = ELECTRON_RESOURCES / "linux_icons"
ELECTRON_ASSETS = REPO / "electron" / "assets"
ELECTRON_SRC_ASSETS = REPO / "electron" / "src" / "assets"
MOBILE_ASSETS = REPO / "mobile" / "assets"

# Padding around the mark inside the square icon (fraction of side).
PAD_FRAC = 0.14
# Tighter pad for favicons / in-app mark so the glyph reads larger at small sizes.
PAD_FRAC_MARK = 0.06
BG = (0, 0, 0, 255)


def render_source(src: Path, scale: float = 6.0) -> Image.Image:
    doc = fitz.open(src)
    page = doc[0]
    pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=True)
    return Image.frombytes("RGBA", (pix.width, pix.height), pix.samples)


def extract_mark(img: Image.Image) -> Image.Image:
    """Crop to opaque white mark; drop any near-black page fill."""
    arr = np.array(img.convert("RGBA"))
    rgb = arr[:, :, :3].astype(np.int16)
    alpha = arr[:, :, 3]
    # Keep bright pixels (the white mark), ignore black page background.
    luma = rgb.mean(axis=2)
    mask = (alpha > 16) & (luma > 40)
    if not mask.any():
        raise RuntimeError("No logo mark found in source render")
    ys, xs = np.where(mask)
    y0, y1 = int(ys.min()), int(ys.max()) + 1
    x0, x1 = int(xs.min()), int(xs.max()) + 1
    cropped = arr[y0:y1, x0:x1].copy()
    c_rgb = cropped[:, :, :3].astype(np.int16)
    c_alpha = cropped[:, :, 3]
    c_luma = c_rgb.mean(axis=2)
    keep = (c_alpha > 16) & (c_luma > 40)
    out = np.zeros_like(cropped)
    out[keep, 0:3] = 255
    # Preserve soft edges from source alpha on bright pixels.
    out[keep, 3] = np.clip(c_alpha[keep].astype(np.int16) * c_luma[keep] / 255.0, 0, 255).astype(
        np.uint8
    )
    return Image.fromarray(out)


def compose_square(
    mark: Image.Image,
    size: int,
    *,
    transparent: bool = False,
    pad_frac: float = PAD_FRAC,
) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0) if transparent else BG)
    inner = int(round(size * (1.0 - 2 * pad_frac)))
    fitted = mark.copy()
    fitted.thumbnail((inner, inner), Image.Resampling.LANCZOS)
    x = (size - fitted.width) // 2
    y = (size - fitted.height) // 2
    canvas.paste(fitted, (x, y), fitted)
    if not transparent:
        # Flatten onto black for OS / home-screen icons.
        flat = Image.new("RGBA", (size, size), BG)
        flat.alpha_composite(canvas)
        return flat
    return canvas


def compose_mark(mark: Image.Image, size: int) -> Image.Image:
    """White mark on transparent — favicons and in-app UI."""
    return compose_square(mark, size, transparent=True, pad_frac=PAD_FRAC_MARK)


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="PNG", optimize=True)
    print(f"wrote {path.relative_to(REPO)} ({img.size[0]}x{img.size[1]})")


def save_ico(images: list[Image.Image], path: Path) -> None:
    """Write a multi-size ICO (Pillow)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    # Pillow expects the largest first when sizes= is passed.
    ordered = sorted(images, key=lambda i: i.size[0], reverse=True)
    sizes = [(i.size[0], i.size[1]) for i in ordered]
    ordered[0].save(path, format="ICO", sizes=sizes, append_images=ordered[1:])
    print(f"wrote {path.relative_to(REPO)} sizes={sizes}")


def png_chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def image_to_png_bytes(img: Image.Image) -> bytes:
    import io

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def save_icns(master: Image.Image, path: Path) -> None:
    """
    Minimal ICNS writer for common macOS icon types (PNG-compressed).
    Enough for electron-builder / Finder.
    """
    # type -> pixel size (1x). @2x entries use the same type table with doubled pixels.
    entries: list[tuple[bytes, int]] = [
        (b"icp4", 16),
        (b"icp5", 32),
        (b"icp6", 64),
        (b"ic07", 128),
        (b"ic08", 256),
        (b"ic09", 512),
        (b"ic10", 1024),  # 512@2x
        (b"ic11", 32),  # 16@2x
        (b"ic12", 64),  # 32@2x
        (b"ic13", 256),  # 128@2x
        (b"ic14", 512),  # 256@2x
    ]
    blobs: list[bytes] = []
    for tag, px in entries:
        png = image_to_png_bytes(compose_square(master, px))
        blobs.append(tag + struct.pack(">I", len(png) + 8) + png)
    body = b"".join(blobs)
    data = b"icns" + struct.pack(">I", len(body) + 8) + body
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    print(f"wrote {path.relative_to(REPO)} ({len(data)} bytes)")


def copy(src: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)
    print(f"copied -> {dest.relative_to(REPO)}")


def main() -> None:
    src = LOCAL_SOURCE if LOCAL_SOURCE.exists() else DEFAULT_SOURCE
    if not src.exists():
        raise SystemExit(f"Source logo not found: {src}")

    if src.resolve() != LOCAL_SOURCE.resolve():
        shutil.copy2(src, LOCAL_SOURCE)
        print(f"stored source copy at {LOCAL_SOURCE.relative_to(REPO)}")

    rendered = render_source(src)
    mark = extract_mark(rendered)
    save_png(mark, HERE / "mark.png")

    master_1024 = compose_square(mark, 1024)
    master_mark_1024 = compose_mark(mark, 1024)
    save_png(master_1024, HERE / "app-icon-1024.png")
    save_png(master_mark_1024, HERE / "app-icon-mark-1024.png")

    # In-app + browser tab: transparent (alpha), no black plate.
    web_alpha = {
        "nodetool_icon.png": 128,
        "nodetool_48px.png": 48,
        "favicon-16x16.png": 16,
        "favicon-32x32.png": 32,
        "favicon-48x48.png": 48,
        "favicon-64x64.png": 64,
        "favicon-128x128.png": 128,
    }
    for name, size in web_alpha.items():
        save_png(compose_mark(mark, size), WEB_PUBLIC / name)

    # Home-screen / PWA: opaque black plate (iOS / Android expect a fill).
    web_opaque = {
        "apple-touch-icon.png": 180,
        "logo192.png": 192,
        "logo512.png": 512,
        "android-chrome-192x192.png": 192,
        "android-chrome-512x512.png": 512,
        "logo.png": 512,
    }
    for name, size in web_opaque.items():
        save_png(compose_square(mark, size), WEB_PUBLIC / name)

    # Multi-size favicon.ico (RGBA / alpha)
    ico_sizes = [16, 24, 32, 48, 64, 128, 256]
    save_ico([compose_mark(mark, s) for s in ico_sizes], WEB_PUBLIC / "favicon.ico")

    # Electron packaging icons
    icon_512 = compose_square(mark, 512)
    save_png(icon_512, ELECTRON_RESOURCES / "icon.png")
    save_ico([compose_square(mark, s) for s in ico_sizes], ELECTRON_RESOURCES / "icon.ico")
    save_icns(mark, ELECTRON_RESOURCES / "icon.icns")

    for size in (16, 24, 32, 48, 64, 128, 256, 512):
        save_png(compose_square(mark, size), ELECTRON_LINUX / f"icon_{size}x{size}.png")

    # Tray + boot splash
    save_png(compose_square(mark, 32), ELECTRON_ASSETS / "tray-icon.png")
    save_ico([compose_square(mark, s) for s in (16, 24, 32, 48, 64)], ELECTRON_ASSETS / "tray-icon.ico")
    save_png(compose_square(mark, 512), ELECTRON_SRC_ASSETS / "logo.png")

    # Expo / React Native
    if MOBILE_ASSETS.is_dir():
        save_png(compose_square(mark, 1024), MOBILE_ASSETS / "icon.png")
        save_png(compose_square(mark, 1024), MOBILE_ASSETS / "adaptive-icon.png")
        save_png(compose_square(mark, 1024), MOBILE_ASSETS / "splash-icon.png")
        save_png(compose_mark(mark, 48), MOBILE_ASSETS / "favicon.png")

    # Cleanup one-off preview helpers if present.
    for junk in ("_preview.png", "_render_preview.py"):
        p = HERE / junk
        if p.exists():
            p.unlink()
            print(f"removed {p.name}")

    print("done")


if __name__ == "__main__":
    main()
