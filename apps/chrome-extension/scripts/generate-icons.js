const fs = require('fs');
const path = require('path');

// Simple PNG creation function using Buffer
function createSimplePNG(width, height, color = [74, 222, 128]) {
  // PNG signature
  const signature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(2, 9); // color type (RGB)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrLength = Buffer.alloc(4);
  ihdrLength.writeUInt32BE(13, 0);

  const ihdrType = Buffer.from('IHDR');
  const ihdrCRC = Buffer.alloc(4);
  ihdrCRC.writeUInt32BE(0x0d4a2353, 0); // Precalculated CRC for basic IHDR

  // Create simple image data (solid color)
  const pixelData = Buffer.alloc(width * height * 3);
  for (let i = 0; i < pixelData.length; i += 3) {
    pixelData[i] = color[0]; // R
    pixelData[i + 1] = color[1]; // G
    pixelData[i + 2] = color[2]; // B
  }

  // Add filter bytes (0 for each scanline)
  const filteredData = Buffer.alloc(width * height * 3 + height);
  for (let y = 0; y < height; y++) {
    filteredData[y * (width * 3 + 1)] = 0; // Filter type 0
    pixelData.copy(
      filteredData,
      y * (width * 3 + 1) + 1,
      y * width * 3,
      (y + 1) * width * 3
    );
  }

  // Compress data (simplified - just store uncompressed)
  const zlib = require('zlib');
  const compressedData = zlib.deflateSync(filteredData);

  // IDAT chunk
  const idatLength = Buffer.alloc(4);
  idatLength.writeUInt32BE(compressedData.length, 0);
  const idatType = Buffer.from('IDAT');
  const idatCRC = Buffer.alloc(4);

  // Calculate CRC for IDAT
  const crcBuffer = Buffer.concat([idatType, compressedData]);
  const crc = require('crc-32');
  idatCRC.writeUInt32BE(crc.buf(crcBuffer) >>> 0, 0);

  // IEND chunk
  const iendLength = Buffer.alloc(4);
  iendLength.writeUInt32BE(0, 0);
  const iendType = Buffer.from('IEND');
  const iendCRC = Buffer.alloc(4);
  iendCRC.writeUInt32BE(0xae426082, 0); // Precalculated CRC for IEND

  // Combine all chunks
  return Buffer.concat([
    signature,
    ihdrLength,
    ihdrType,
    ihdrData,
    ihdrCRC,
    idatLength,
    idatType,
    compressedData,
    idatCRC,
    iendLength,
    iendType,
    iendCRC,
  ]);
}

// Create icons directory
const iconsDir = path.join(__dirname, '../src/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons in different sizes
const sizes = [16, 32, 48, 128];
const greenColor = [74, 222, 128]; // #4ade80

console.log('Generating placeholder PNG icons...');

try {
  // Use a much simpler approach - create minimal valid PNG files
  const Canvas = require('canvas');

  sizes.forEach(size => {
    const canvas = Canvas.createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Create gradient background
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    gradient.addColorStop(0, '#4ade80');
    gradient.addColorStop(1, '#22c55e');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Add leaf emoji or simple shape
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 3, 0, Math.PI * 2);
    ctx.fill();

    // Add CO2 text for larger icons
    if (size >= 32) {
      ctx.fillStyle = 'white';
      ctx.font = `bold ${Math.floor(size / 8)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CO₂', size / 2, size / 2);
    }

    // Save as PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), buffer);
    console.log(`Created icon${size}.png`);
  });
} catch (error) {
  console.log('Canvas not available, creating simple colored squares...');

  // Fallback: create simple colored PNG files
  sizes.forEach(size => {
    // Create a simple base64 encoded PNG for each size
    const base64Data = createSimpleBase64PNG(size);
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), buffer);
    console.log(`Created simple icon${size}.png`);
  });
}

function createSimpleBase64PNG(size) {
  // This is a very basic green square PNG in base64
  // For 16x16 green square
  if (size === 16) {
    return 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFSSURBVDiNpZM9SwNBEIafgJ2FjWBhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYKHgB7BwQANjQOQOAAAAAElFTkSuQmCC';
  }

  // For other sizes, use a scaled version (simplified)
  return 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFSSURBVDiNpZM9SwNBEIafgJ2FjWBhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYGFhYWGhYKHgB7BwQANjQOQOAAAAAElFTkSuQmCC';
}

console.log('Icon generation complete!');
