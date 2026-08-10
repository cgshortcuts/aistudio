/**
 * Rasterize web/public/ai-icon.svg into favicons, Electron icons, and the
 * repo-root Windows folder/shortcut ICO.
 *
 *   node web/src/custom/branding/assets/generate_icons_from_svg.mjs
 */
import { mkdir, mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "../../../../..");
const SVG = path.join(REPO, "web/public/ai-icon.svg");
const WEB_PUBLIC = path.join(REPO, "web/public");
const ELECTRON_RESOURCES = path.join(REPO, "electron/resources");
const ELECTRON_LINUX = path.join(ELECTRON_RESOURCES, "linux_icons");
const ELECTRON_ASSETS = path.join(REPO, "electron/assets");
const ELECTRON_SRC_ASSETS = path.join(REPO, "electron/src/assets");
const MOBILE_ASSETS = path.join(REPO, "mobile/assets");

async function pngBuffer(size, { transparent = true } = {}) {
  const pipeline = sharp(SVG).resize(size, size, {
    fit: "contain",
    background: transparent
      ? { r: 0, g: 0, b: 0, alpha: 0 }
      : { r: 0, g: 0, b: 0, alpha: 1 }
  });
  if (!transparent) {
    return pipeline.flatten({ background: "#000000" }).png().toBuffer();
  }
  return pipeline.png().toBuffer();
}

async function writePng(dest, size, opts) {
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, await pngBuffer(size, opts));
  console.log(`wrote ${path.relative(REPO, dest)} (${size}x${size})`);
}

async function writeIco(dest, sizes, opts) {
  const tempDir = await mkdtemp(path.join(tmpdir(), "aistudio-ico-"));
  try {
    const pngPaths = [];
    for (const size of sizes) {
      const p = path.join(tempDir, `${size}.png`);
      await writeFile(p, await pngBuffer(size, opts));
      pngPaths.push(p);
    }
    const py = `
from PIL import Image
from pathlib import Path
paths = ${JSON.stringify(pngPaths)}
dest = Path(${JSON.stringify(dest)})
images = [Image.open(p).convert("RGBA") for p in paths]
ordered = sorted(images, key=lambda i: i.size[0], reverse=True)
sizes = [(i.size[0], i.size[1]) for i in ordered]
dest.parent.mkdir(parents=True, exist_ok=True)
ordered[0].save(dest, format="ICO", sizes=sizes, append_images=ordered[1:])
print(f"wrote {dest} sizes={sizes}")
`;
    const result = spawnSync("python", ["-c", py], { encoding: "utf8" });
    if (result.status !== 0) {
      throw new Error(result.stderr || result.stdout || "python ico failed");
    }
    process.stdout.write(result.stdout);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function main() {
  const alpha = {
    "nodetool_icon.png": 128,
    "nodetool_48px.png": 48,
    "favicon-16x16.png": 16,
    "favicon-32x32.png": 32,
    "favicon-48x48.png": 48,
    "favicon-64x64.png": 64,
    "favicon-128x128.png": 128
  };
  for (const [name, size] of Object.entries(alpha)) {
    await writePng(path.join(WEB_PUBLIC, name), size, { transparent: true });
  }

  const opaque = {
    "apple-touch-icon.png": 180,
    "logo192.png": 192,
    "logo512.png": 512,
    "android-chrome-192x192.png": 192,
    "android-chrome-512x512.png": 512,
    "logo.png": 512
  };
  for (const [name, size] of Object.entries(opaque)) {
    await writePng(path.join(WEB_PUBLIC, name), size, { transparent: false });
  }

  const icoSizes = [16, 24, 32, 48, 64, 128, 256];
  await writeIco(path.join(WEB_PUBLIC, "favicon.ico"), icoSizes, {
    transparent: true
  });

  await writePng(path.join(ELECTRON_RESOURCES, "icon.png"), 512, {
    transparent: false
  });
  await writeIco(path.join(ELECTRON_RESOURCES, "icon.ico"), icoSizes, {
    transparent: false
  });

  // macOS .icns from a 1024 master (Pillow + minimal ICNS writer)
  const master1024 = path.join(ELECTRON_RESOURCES, "_icon-1024.png");
  await writePng(master1024, 1024, { transparent: false });
  const icnsDest = path.join(ELECTRON_RESOURCES, "icon.icns");
  const icnsPy = `
from pathlib import Path
import struct, zlib
from PIL import Image
import io

master = Image.open(${JSON.stringify(master1024)}).convert("RGBA")
dest = Path(${JSON.stringify(icnsDest)})

def png_bytes(img):
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()

def compose(size):
    return master.resize((size, size), Image.Resampling.LANCZOS)

entries = [
    (b"icp4", 16), (b"icp5", 32), (b"icp6", 64),
    (b"ic07", 128), (b"ic08", 256), (b"ic09", 512),
    (b"ic10", 1024), (b"ic11", 32), (b"ic12", 64),
    (b"ic13", 256), (b"ic14", 512),
]
blobs = []
for tag, px in entries:
    png = png_bytes(compose(px))
    blobs.append(tag + struct.pack(">I", len(png) + 8) + png)
body = b"".join(blobs)
dest.write_bytes(b"icns" + struct.pack(">I", len(body) + 8) + body)
print(f"wrote {dest} ({dest.stat().st_size} bytes)")
`;
  const icnsResult = spawnSync("python", ["-c", icnsPy], { encoding: "utf8" });
  if (icnsResult.status !== 0) {
    throw new Error(icnsResult.stderr || icnsResult.stdout || "icns failed");
  }
  process.stdout.write(icnsResult.stdout);
  await rm(master1024, { force: true });

  for (const size of [16, 24, 32, 48, 64, 128, 256, 512]) {
    await writePng(path.join(ELECTRON_LINUX, `icon_${size}x${size}.png`), size, {
      transparent: false
    });
  }

  await writePng(path.join(ELECTRON_ASSETS, "tray-icon.png"), 32, {
    transparent: false
  });
  await writeIco(
    path.join(ELECTRON_ASSETS, "tray-icon.ico"),
    [16, 24, 32, 48, 64],
    { transparent: false }
  );
  await writePng(path.join(ELECTRON_SRC_ASSETS, "logo.png"), 512, {
    transparent: false
  });

  // Repo-root Windows Explorer / shortcut icon
  await writeIco(path.join(REPO, "ai-icon.ico"), icoSizes, {
    transparent: true
  });

  try {
    await writePng(path.join(MOBILE_ASSETS, "icon.png"), 1024, {
      transparent: false
    });
    await writePng(path.join(MOBILE_ASSETS, "adaptive-icon.png"), 1024, {
      transparent: false
    });
    await writePng(path.join(MOBILE_ASSETS, "splash-icon.png"), 1024, {
      transparent: false
    });
    await writePng(path.join(MOBILE_ASSETS, "favicon.png"), 48, {
      transparent: true
    });
  } catch (err) {
    console.warn("mobile assets skipped:", err.message);
  }

  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
