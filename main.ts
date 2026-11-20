// Copies the pre-rendered entry.png (built by build.mjs from stories.json) to the output directory.
// Node 22, standard library only, no network.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const png = readFileSync(new URL('./entry.png', import.meta.url));
const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
if (!png.subarray(0, 8).equals(SIGNATURE)) throw new Error('entry.png is not a PNG');
if (png.length > 1024 * 1024) throw new Error(`entry.png is ${png.length} bytes, over 1 MiB`);
const width = png.readUInt32BE(16), height = png.readUInt32BE(20); // IHDR
if (width > 1024 || height > 1024) throw new Error(`entry.png is ${width}x${height}, over 1024x1024`);

const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
writeFileSync(join(outDir, 'entry.png'), png);
console.log(`wrote ${join(outDir, 'entry.png')} (${width}x${height}, ${png.length} bytes)`);
