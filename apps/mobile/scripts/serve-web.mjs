#!/usr/bin/env node
/**
 * Serves the exported web build, with no dependencies to install.
 *
 * `npx serve` needs a network fetch and an interactive install prompt, both of
 * which are things that can simply fail on a locked-down machine. This uses only
 * Node built-ins, so if `node` runs, this runs.
 *
 * Two things it does that a plain static server does not:
 *
 *   - **SPA fallback.** `app.json` sets `web.output: "single"`, so `/search` and
 *     `/saved` are not files on disk. Without falling back to index.html they
 *     return 404 and every screen except the home page looks broken.
 *   - **Prints the LAN address**, so there is no separate `ipconfig` step before
 *     opening it on a phone.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../dist', import.meta.url)));
const port = Number(process.argv[2] ?? process.env.PORT ?? 5000);

if (!existsSync(root)) {
  console.error(`\n✗ No web build at ${root}\n`);
  console.error('  Build it first:');
  console.error('    pnpm --filter @vastra/mobile exec expo export --platform web\n');
  process.exit(1);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.map': 'application/json; charset=utf-8',
};

function send(res, status, filePath) {
  res.writeHead(status, {
    'Content-Type': TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
    // No caching: the whole point is seeing a change after a re-export.
    'Cache-Control': 'no-store',
  });
  createReadStream(filePath).pipe(res);
}

const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  // normalize() collapses `..`, so a request cannot climb out of dist.
  const candidate = join(root, normalize(url));

  if (candidate.startsWith(root) && existsSync(candidate) && statSync(candidate).isFile()) {
    send(res, 200, candidate);
    return;
  }

  // Anything else is a client-side route.
  send(res, 200, join(root, 'index.html'));
});

function lanAddress() {
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === 'IPv4' && !address.internal) return address.address;
    }
  }
  return null;
}

server.listen(port, '0.0.0.0', () => {
  const lan = lanAddress();
  console.log('\n  Vastra — web preview\n');
  console.log(`  On this PC:  http://localhost:${port}`);
  if (lan) console.log(`  On a phone:  http://${lan}:${port}   (same Wi-Fi)`);
  console.log('\n  Ctrl+C to stop.\n');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n✗ Port ${port} is already in use.`);
    console.error(`  Try another:  node apps/mobile/scripts/serve-web.mjs 5050\n`);
  } else {
    console.error(`\n✗ ${error.message}\n`);
  }
  process.exit(1);
});
