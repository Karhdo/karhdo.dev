#!/usr/bin/env node
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientPath = join(__dirname, '..', 'node_modules', '.prisma', 'client');

const defaultTsContent = `export * from './client.js'\n`;
const defaultJsContent = `module.exports = require('./client.js')\n`;

writeFileSync(join(clientPath, 'default.ts'), defaultTsContent);
writeFileSync(join(clientPath, 'default.d.ts'), defaultTsContent);
writeFileSync(join(clientPath, 'default.js'), defaultJsContent);

console.log('✓ Created default.ts, default.d.ts, and default.js in node_modules/.prisma/client');
