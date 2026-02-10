import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const ROOT = process.cwd();

const INPUT = path.join(ROOT, "public", "logo.png");
const OUT_DIR = path.join(ROOT, "app");

async function ensureInput() {
  if (!fs.existsSync(INPUT)) {
    throw new Error(`Missing logo at ${INPUT}`);
  }
}

async function main() {
  await ensureInput();

  // Next.js App Router conventions
  const iconPng = path.join(OUT_DIR, "icon.png");
  const applePng = path.join(OUT_DIR, "apple-icon.png");
  const faviconIco = path.join(OUT_DIR, "favicon.ico");

  // 512x512 app icon
  await sharp(INPUT)
    .resize(512, 512, { fit: "cover" })
    .png({ quality: 95 })
    .toFile(iconPng);

  // 180x180 Apple touch icon
  await sharp(INPUT)
    .resize(180, 180, { fit: "cover" })
    .png({ quality: 95 })
    .toFile(applePng);

  // Multi-size favicon.ico
  const sizes = [16, 32, 48, 64];
  const pngBuffers = await Promise.all(
    sizes.map((s) => sharp(INPUT).resize(s, s, { fit: "cover" }).png().toBuffer()),
  );
  const icoBuffer = await pngToIco(pngBuffers);
  fs.writeFileSync(faviconIco, icoBuffer);

  console.log("Generated:", { iconPng, applePng, faviconIco });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
