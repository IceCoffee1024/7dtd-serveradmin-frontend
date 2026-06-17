import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const distAssetsDir = path.resolve('dist/assets');
const maxRows = Number(process.env.BUILD_ANALYZE_ROWS || 20);

function formatBytes(bytes) {
  if (bytes < 1024)
    return `${bytes} B`;

  return `${(bytes / 1024).toFixed(2)} kB`;
}

async function collectAssets(dir) {
  const entries = await readdir(dir);
  const assets = [];

  for (const entry of entries) {
    const filePath = path.join(dir, entry);
    const info = await stat(filePath);
    if (!info.isFile() || !/\.(?:js|css)$/.test(entry))
      continue;

    const content = await readFile(filePath);
    assets.push({
      name: entry,
      type: path.extname(entry).slice(1),
      size: info.size,
      gzipSize: gzipSync(content).length,
    });
  }

  return assets.sort((a, b) => b.size - a.size);
}

try {
  const assets = await collectAssets(distAssetsDir);
  const totals = assets.reduce(
    (acc, asset) => {
      acc.size += asset.size;
      acc.gzipSize += asset.gzipSize;
      return acc;
    },
    { size: 0, gzipSize: 0 },
  );

  console.log(`Build assets: ${assets.length} JS/CSS files`);
  console.log(`Total size: ${formatBytes(totals.size)} (${formatBytes(totals.gzipSize)} gzip)`);
  console.log('');
  console.log(`Largest ${Math.min(maxRows, assets.length)} assets:`);

  for (const asset of assets.slice(0, maxRows)) {
    console.log(`${asset.type.padEnd(3)} ${formatBytes(asset.size).padStart(10)} ${formatBytes(asset.gzipSize).padStart(10)} gzip  ${asset.name}`);
  }
}
catch (error) {
  console.error('[build-analyze] Failed to analyze dist/assets.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
