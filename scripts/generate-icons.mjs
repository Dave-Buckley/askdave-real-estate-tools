/**
 * Generate professional "Ask Dave" app icons from SVG.
 * Creates PNG at all required sizes + ICO for Windows.
 */
import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'build', 'icons')

// Professional logo SVG:
// - Rounded square with dark background matching app theme
// - "AD" monogram with clean modern typography
// - Subtle roof/peak accent in indigo
// - Works well at all sizes from 16px to 512px
const SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1a2e"/>
      <stop offset="100%" stop-color="#0d0d1a"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#818cf8"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
    <linearGradient id="textGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f0f0f2"/>
      <stop offset="100%" stop-color="#d4d4db"/>
    </linearGradient>
  </defs>

  <!-- Background rounded square -->
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>

  <!-- Subtle inner border -->
  <rect x="4" y="4" width="504" height="504" rx="92" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>

  <!-- Roofline accent at top -->
  <path d="M 160 145 L 256 80 L 352 145" fill="none" stroke="url(#accent)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Small chimney detail -->
  <rect x="305" y="90" width="12" height="30" rx="3" fill="url(#accent)" opacity="0.7"/>

  <!-- "A" letter -->
  <text x="185" y="365" font-family="Segoe UI, SF Pro Display, Helvetica, Arial, sans-serif" font-weight="700" font-size="260" fill="url(#textGrad)" text-anchor="middle" letter-spacing="-8">A</text>

  <!-- "D" letter -->
  <text x="345" y="365" font-family="Segoe UI, SF Pro Display, Helvetica, Arial, sans-serif" font-weight="300" font-size="230" fill="url(#textGrad)" text-anchor="middle" letter-spacing="-4" opacity="0.85">D</text>

  <!-- Bottom accent line -->
  <rect x="130" y="400" width="252" height="3" rx="1.5" fill="url(#accent)" opacity="0.5"/>

  <!-- "REAL ESTATE" text at bottom -->
  <text x="256" y="445" font-family="Segoe UI, SF Pro Display, Helvetica, Arial, sans-serif" font-weight="600" font-size="36" fill="#818cf8" text-anchor="middle" letter-spacing="12" opacity="0.8">REAL ESTATE</text>
</svg>
`

// SVG optimized for small sizes (16-48px) — simpler, just the AD monogram
const SVG_SMALL = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1a2e"/>
      <stop offset="100%" stop-color="#0d0d1a"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#818cf8"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>

  <!-- Roofline -->
  <path d="M 160 170 L 256 105 L 352 170" fill="none" stroke="url(#accent)" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- "A" — bold, centered -->
  <text x="195" y="385" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-weight="700" font-size="280" fill="#ededee" text-anchor="middle">A</text>

  <!-- "D" — lighter weight -->
  <text x="340" y="385" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-weight="300" font-size="240" fill="#ededee" text-anchor="middle" opacity="0.85">D</text>
</svg>
`

const sizes = [16, 24, 32, 48, 64, 128, 256, 512]

async function main() {
  console.log('Generating icons...')

  for (const size of sizes) {
    const svg = size <= 48 ? SVG_SMALL : SVG
    const buf = await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toBuffer()

    const name = size === 256 ? 'icon.png' : `icon_${size}.png`
    writeFileSync(join(OUT, name), buf)
    console.log(`  ${name} (${size}x${size})`)

    // Also save individual size files for all sizes
    if (size === 256) {
      writeFileSync(join(OUT, 'icon_256.png'), buf)
      writeFileSync(join(OUT, 'icon_rgba.png'), buf)
    }
  }

  // Generate ICO from multiple sizes (16, 32, 48, 256)
  const icoSizes = [16, 32, 48, 256]
  const icoPngs = []
  for (const size of icoSizes) {
    const svg = size <= 48 ? SVG_SMALL : SVG
    const buf = await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toBuffer()
    icoPngs.push(buf)
  }

  const ico = await pngToIco(icoPngs)
  writeFileSync(join(OUT, 'icon.ico'), ico)
  console.log('  icon.ico (multi-resolution)')

  console.log('Done!')
}

main().catch(console.error)
