import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

// SVG template for the DishDollar icon
const createSvgIcon = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 192 192">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#22c55e"/>
      <stop offset="100%" style="stop-color:#16a34a"/>
    </linearGradient>
  </defs>
  <circle cx="96" cy="96" r="96" fill="url(#bgGradient)"/>
  <circle cx="96" cy="96" r="70" fill="white" opacity="0.15"/>
  <circle cx="96" cy="96" r="55" fill="white" opacity="0.1"/>
  <text x="96" y="120" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white" text-anchor="middle">$</text>
  <rect x="40" y="60" width="4" height="40" rx="2" fill="white" opacity="0.6" transform="rotate(-20 42 80)"/>
  <rect x="148" y="60" width="4" height="40" rx="2" fill="white" opacity="0.6" transform="rotate(20 150 80)"/>
</svg>
`;

// Apple touch icon (solid background, no transparency)
const createAppleTouchIcon = () => `
<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <rect width="180" height="180" fill="#22c55e"/>
  <circle cx="90" cy="90" r="65" fill="white" opacity="0.15"/>
  <circle cx="90" cy="90" r="50" fill="white" opacity="0.1"/>
  <text x="90" y="113" font-family="Arial, sans-serif" font-size="75" font-weight="bold" fill="white" text-anchor="middle">$</text>
</svg>
`;

// Favicon (simpler design for small size)
const createFavicon = () => `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="16" fill="#22c55e"/>
  <text x="16" y="22" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">$</text>
</svg>
`;

async function generateIcons() {
  console.log('Generating PWA icons...');

  // Generate 192x192 icon
  await sharp(Buffer.from(createSvgIcon(192)))
    .resize(192, 192)
    .png()
    .toFile(join(publicDir, 'pwa-192x192.png'));
  console.log('Created pwa-192x192.png');

  // Generate 512x512 icon
  await sharp(Buffer.from(createSvgIcon(192)))
    .resize(512, 512)
    .png()
    .toFile(join(publicDir, 'pwa-512x512.png'));
  console.log('Created pwa-512x512.png');

  // Generate Apple Touch Icon (180x180)
  await sharp(Buffer.from(createAppleTouchIcon()))
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // Generate favicon.ico (32x32 PNG, browsers accept PNG favicons)
  await sharp(Buffer.from(createFavicon()))
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, 'favicon.ico'));
  console.log('Created favicon.ico');

  // Generate mask-icon.svg for Safari
  const maskIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
  <circle cx="8" cy="8" r="8" fill="black"/>
  <text x="8" y="11" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="white" text-anchor="middle">$</text>
</svg>
`;
  await sharp(Buffer.from(maskIconSvg))
    .resize(16, 16)
    .toFile(join(publicDir, 'mask-icon.svg'));
  console.log('Created mask-icon.svg');

  console.log('All PWA icons generated successfully!');
}

generateIcons().catch(console.error);
