import sharp from 'sharp';

/**
 * Applies a premium-styled semi-transparent "GlowUp AI" watermark to the bottom-right corner of an image buffer.
 */
export async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // 1. Get image metadata to determine dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 800;

    // 2. Define watermark dimensions
    const watermarkWidth = Math.round(width * 0.25); // 25% of image width
    const watermarkHeight = Math.round(watermarkWidth * 0.28); // aspect ratio for watermark card

    // Keep watermark sizes within reasonable bounds
    const svgWidth = Math.max(140, Math.min(watermarkWidth, 240));
    const svgHeight = Math.max(40, Math.min(watermarkHeight, 68));

    // 3. Create a beautiful translucent SVG overlay card
    const watermarkSvg = `
      <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff758c" stop-opacity="0.9" />
            <stop offset="100%" stop-color="#ff7eb3" stop-opacity="0.9" />
          </linearGradient>
        </defs>
        <!-- Card background -->
        <rect x="2" y="2" width="${svgWidth - 4}" height="${svgHeight - 4}" rx="8" fill="rgba(15, 15, 18, 0.65)" stroke="url(#glow)" stroke-width="1.5" />
        <!-- App text with sparkles -->
        <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${svgHeight * 0.32}" font-weight="800" fill="#ffffff" letter-spacing="0.5">
          ✨ GlowUp AI
        </text>
      </svg>
    `;

    // 4. Position watermark at bottom-right corner with padding
    const padding = Math.max(12, Math.round(width * 0.03)); // 3% padding
    const top = height - svgHeight - padding;
    const left = width - svgWidth - padding;

    // 5. Composite watermark onto image
    return await sharp(imageBuffer)
      .composite([{
        input: Buffer.from(watermarkSvg),
        top: Math.max(0, top),
        left: Math.max(0, left),
      }])
      .toBuffer();
  } catch (err) {
    console.error('[Watermark Error] Failed to apply watermark to buffer:', err);
    // If watermarking fails for any reason, return the original image buffer so we don't break the user flow
    return imageBuffer;
  }
}

export default addWatermark;
