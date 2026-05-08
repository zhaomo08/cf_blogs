#!/usr/bin/env node
import { mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'node_modules', 'leaflet', 'dist');
const dst = join(root, 'public', 'vendor', 'leaflet');

const files = [
  'leaflet.css',
  'leaflet.js',
  'images/marker-icon.png',
  'images/marker-icon-2x.png',
  'images/marker-shadow.png',
];

mkdirSync(join(dst, 'images'), { recursive: true });
for (const f of files) {
  copyFileSync(join(src, f), join(dst, f));
  console.log(`copied ${f}`);
}
console.log('Leaflet vendor files copied to public/vendor/leaflet/');
