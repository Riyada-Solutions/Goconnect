/**
 * Expo config plugin — strips the alpha channel from the iOS 1024x1024 App
 * Store icon after prebuild generates it.  Apple rejects icons that contain
 * an alpha channel (error: "can't be transparent or contain an alpha channel").
 *
 * The plugin runs in the "dangerous" mod lifecycle so it executes during
 * `expo prebuild` (both plain and --clean).
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ICON_PATH = path.join(
  'ios', 'Goconnect', 'Images.xcassets', 'AppIcon.appiconset',
  'App-Icon-1024x1024@1x.png',
);

/** Returns true when the PNG at `filePath` contains an alpha channel. */
function hasAlpha(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    // PNG IHDR: bytes 16-28; color type is at offset 25
    const colorType = buf[25];
    return colorType === 4 || colorType === 6; // grayscale+alpha or RGBA
  } catch {
    return false;
  }
}

/** Flatten alpha by compositing over #2DAAAE using sips (macOS built-in). */
function stripAlphaSips(filePath) {
  // sips is macOS-only; EAS Linux workers won't have it — fall through to the
  // Node fallback in that case.
  try {
    execSync(
      `sips --setProperty format png --setProperty hasAlpha false "${filePath}"`,
      { stdio: 'ignore' },
    );
    return !hasAlpha(filePath);
  } catch {
    return false;
  }
}

/** Flatten alpha using pure-Node PNG manipulation (no native deps). */
function stripAlphaNode(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    // Only handle 8-bit RGBA (color type 6) — the only type Expo generates.
    if (buf[25] !== 6) return;

    const pngjs = require('pngjs');
    if (!pngjs) return;

    const { PNG } = pngjs;
    const src = PNG.sync.read(buf);
    const { width, height } = src;

    // Brand background colour
    const BR = 0x2D, BG = 0xAA, BB = 0xAE;

    const dst = new PNG({ width, height, colorType: 2 }); // colorType 2 = RGB
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const si = (y * width + x) * 4;
        const di = (y * width + x) * 3;
        const a  = src.data[si + 3] / 255;
        dst.data[di]     = Math.round(src.data[si]     * a + BR * (1 - a));
        dst.data[di + 1] = Math.round(src.data[si + 1] * a + BG * (1 - a));
        dst.data[di + 2] = Math.round(src.data[si + 2] * a + BB * (1 - a));
      }
    }
    fs.writeFileSync(filePath, PNG.sync.write(dst));
  } catch {
    // pngjs not available — no-op; icon was already fixed in the asset catalog
  }
}

module.exports = (config) =>
  withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const iconPath = path.join(cfg.modRequest.projectRoot, ICON_PATH);
      if (fs.existsSync(iconPath) && hasAlpha(iconPath)) {
        if (!stripAlphaSips(iconPath)) {
          stripAlphaNode(iconPath);
        }
      }
      return cfg;
    },
  ]);
