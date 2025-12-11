#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Thư mục output Prisma Client: prisma/generated/prisma
const clientDir = join(__dirname, '..', 'prisma', 'generated', 'prisma');
const clientFile = join(clientDir, 'client.ts');

if (!existsSync(clientFile)) {
  console.warn('[postgenerate] Prisma client.ts not found at', clientFile);
  process.exit(0);
}

let content = readFileSync(clientFile, 'utf8');
const original = content;

content = content
  // enums
  .replace(/"\.\/enums\.js"/g, '"./enums"')
  .replace(/'\.\/enums\.js'/g, "'./enums'")
  // internal/class
  .replace(/"\.\/internal\/class\.js"/g, '"./internal/class"')
  .replace(/'\.\/internal\/class\.js'/g, "'./internal/class'")
  // internal/prismaNamespace
  .replace(/"\.\/internal\/prismaNamespace\.js"/g, '"./internal/prismaNamespace"')
  .replace(/'\.\/internal\/prismaNamespace\.js'/g, "'./internal/prismaNamespace'");

if (content !== original) {
  writeFileSync(clientFile, content, 'utf8');
  console.log('✓ Patched Prisma client imports/exports in', clientFile);
} else {
  console.log('[postgenerate] No changes needed for', clientFile);
}
