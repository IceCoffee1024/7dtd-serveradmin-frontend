import process from 'node:process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DEFAULT_BASE_URL = 'http://7dtdserver.local:8088';

function loadDotEnv() {
  const envPath = resolve(process.cwd(), '.env');
  try {
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
      if (!match)
        continue;

      const [, key, rawValue] = match;
      if (process.env[key] != null)
        continue;

      process.env[key] = rawValue.trim().replace(/^['"]|['"]$/g, '');
    }
  }
  catch {
    // .env is optional for CI and ad-hoc local runs.
  }
}

function getAuthHeader() {
  const username = process.env.LIVE_SMOKE_USERNAME || process.env.VITE_DEFAULT_USERNAME;
  const password = process.env.LIVE_SMOKE_PASSWORD || process.env.VITE_DEFAULT_PASSWORD;
  if (!username || !password)
    return undefined;

  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

async function requestJson(baseUrl, path, authHeader) {
  const response = await fetch(new URL(path, baseUrl), {
    headers: {
      Accept: 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  });

  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    }
    catch {
      body = text;
    }
  }

  if (!response.ok) {
    const summary = typeof body === 'string' ? body.slice(0, 200) : JSON.stringify(body)?.slice(0, 200);
    throw new Error(`${response.status} ${response.statusText}${summary ? `: ${summary}` : ''}`);
  }

  return body;
}

function assert(condition, message) {
  if (!condition)
    throw new Error(message);
}

async function runStep(results, name, action) {
  const started = Date.now();
  try {
    const details = await action();
    results.push({ name, status: 'PASS', durationMs: Date.now() - started, details });
  }
  catch (error) {
    results.push({ name, status: 'FAIL', durationMs: Date.now() - started, error: error instanceof Error ? error.message : String(error) });
  }
}

loadDotEnv();

const baseUrl = process.env.LIVE_SMOKE_BASE_URL
  || process.env.VITE_OPENAPI_INPUT?.replace(/\/swagger\/v1\/swagger\.json$/i, '')
  || DEFAULT_BASE_URL;
const authHeader = getAuthHeader();
const results = [];

await runStep(results, 'swagger schema is reachable', async () => {
  const schema = await requestJson(baseUrl, '/swagger/v1/swagger.json', authHeader);
  assert(schema?.paths, 'Swagger schema does not contain paths.');
  return `${Object.keys(schema.paths).length} paths`;
});

await runStep(results, 'server settings expose 7dtd 3.0 keys', async () => {
  const settings = await requestJson(baseUrl, '/api/GameServer/ServerSettings', authHeader);
  assert(settings && typeof settings === 'object' && !Array.isArray(settings), 'ServerSettings response is not an object.');
  assert(Object.keys(settings).length >= 50, `ServerSettings returned too few keys: ${Object.keys(settings).length}`);
  assert('SandboxCode' in settings, 'ServerSettings is missing SandboxCode.');
  return `${Object.keys(settings).length} settings`;
});

await runStep(results, 'game server read endpoints are reachable', async () => {
  const checks = [
    ['/api/GameServer/Stats', value => value && typeof value === 'object' && !Array.isArray(value), 'Stats must return an object'],
    ['/api/GameServer/Config', value => value && typeof value === 'object' && !Array.isArray(value), 'Config must return an object'],
    ['/api/GameServer/AllowedCommands', Array.isArray, 'AllowedCommands must return an array'],
    ['/api/GameServer/OnlinePlayers', value => value && Array.isArray(value.items), 'OnlinePlayers must return a paged object with items'],
    ['/api/GameServer/HistoryPlayers?pageNumber=1&pageSize=5', value => value && Array.isArray(value.items), 'HistoryPlayers must return a paged object with items'],
    ['/api/GameServer/MapInfo', value => value && typeof value === 'object', 'MapInfo must return an object'],
    ['/api/GameServer/LandClaims', value => value && typeof value === 'object' && Array.isArray(value.claimOwners), 'LandClaims must return a snapshot object with claimOwners'],
    ['/api/GameServer/Mods', Array.isArray, 'Mods must return an array'],
  ];

  const summaries = [];
  for (const [path, predicate, message] of checks) {
    const value = await requestJson(baseUrl, path, authHeader);
    assert(predicate(value), `${message} at ${path}.`);
    summaries.push(`${path.split('/').pop()}:${Array.isArray(value) ? value.length : value?.items ? `${value.items.length}/${value.total ?? '?'}` : 'ok'}`);
  }

  return summaries.join(', ');
});

await runStep(results, 'known languages include 7dtd 3.0 columns', async () => {
  const columns = await requestJson(baseUrl, '/api/GameServer/KnownLanguages', authHeader);
  assert(Array.isArray(columns), 'KnownLanguages response is not an array.');
  assert(columns.some(column => String(column).toLowerCase() === 'keeploaded'), 'KnownLanguages is missing KeepLoaded.');
  assert(columns.some(column => String(column).toLowerCase() === 'english'), 'KnownLanguages is missing english.');
  return columns.join(', ');
});

await runStep(results, 'english game items include localized names', async () => {
  const items = await requestJson(baseUrl, '/api/GameServer/GameItems?language=English', authHeader);
  assert(Array.isArray(items), 'GameItems response is not an array.');
  assert(items.length > 0, 'GameItems returned no items.');
  const localizedCount = items.filter(item => typeof item?.localizedName === 'string' && item.localizedName.trim()).length;
  assert(localizedCount > 0, 'GameItems returned no localizedName values.');
  const stone = items.find(item => item?.name === 'terrStone');
  assert(!stone || stone.localizedName === 'Stone', `terrStone localizedName mismatch: ${stone?.localizedName ?? 'item not found'}`);
  return `${items.length} items, ${localizedCount} localized`;
});

await runStep(results, 'geoip status endpoint is reachable', async () => {
  const status = await requestJson(baseUrl, '/api/GeoIpAccessControl/Status', authHeader);
  assert(status && typeof status === 'object', 'GeoIP status response is not an object.');
  return `enabled=${Boolean(status.isEnabled)}, provider=${status.provider ?? 'unknown'}, cache=${status.cacheCount ?? 0}`;
});

await runStep(results, 'discord bot status endpoint is reachable', async () => {
  const status = await requestJson(baseUrl, '/api/DiscordIntegration/BotStatus', authHeader);
  assert(status && typeof status === 'object', 'Discord BotStatus response is not an object.');
  return `state=${status.state ?? 'unknown'}, running=${Boolean(status.isRunning)}, ready=${Boolean(status.isReady)}`;
});

await runStep(results, 'player tracking endpoints are reachable', async () => {
  const [settings, status, historyPlayers] = await Promise.all([
    requestJson(baseUrl, '/api/PlayerTracking/Settings', authHeader),
    requestJson(baseUrl, '/api/PlayerTracking/Status', authHeader),
    requestJson(baseUrl, '/api/GameServer/HistoryPlayers?pageNumber=1&pageSize=1', authHeader),
  ]);
  assert(settings && typeof settings === 'object', 'PlayerTracking settings response is not an object.');
  assert(status && typeof status === 'object', 'PlayerTracking status response is not an object.');
  assert(typeof status.isEnabled === 'boolean', 'PlayerTracking status is missing isEnabled.');
  assert(Number.isFinite(Number(status.sessionCount)), 'PlayerTracking status is missing sessionCount.');
  assert(historyPlayers && Array.isArray(historyPlayers.items), 'HistoryPlayers did not return items for tracking check.');

  const firstPlayer = historyPlayers.items[0];
  if (firstPlayer?.playerId) {
    const activities = await requestJson(baseUrl, `/api/PlayerTracking/Players/${encodeURIComponent(firstPlayer.playerId)}/Activities?pageNumber=1&pageSize=5`, authHeader);
    assert(activities && Array.isArray(activities.items), 'PlayerTracking activities response is not paged.');
    const track = await requestJson(baseUrl, `/api/PlayerTracking/Players/${encodeURIComponent(firstPlayer.playerId)}/Locations/Track?maxPoints=5`, authHeader);
    assert(track && Array.isArray(track.points), 'PlayerTracking location track response is not valid.');
    const region = await requestJson(baseUrl, '/api/PlayerTracking/Locations/Search?pageNumber=1&pageSize=5', authHeader);
    assert(region && Array.isArray(region.items), 'PlayerTracking region search response is not paged.');
    const snapshots = await requestJson(baseUrl, `/api/PlayerTracking/Players/${encodeURIComponent(firstPlayer.playerId)}/InventorySnapshots?pageNumber=1&pageSize=2`, authHeader);
    assert(snapshots && Array.isArray(snapshots.items), 'PlayerTracking inventory snapshots response is not paged.');
    if (snapshots.items.length >= 2) {
      const [toSnapshot, fromSnapshot] = snapshots.items;
      const compare = await requestJson(baseUrl, `/api/PlayerTracking/Players/${encodeURIComponent(firstPlayer.playerId)}/InventorySnapshots/Compare?fromSnapshotId=${encodeURIComponent(fromSnapshot.id)}&toSnapshotId=${encodeURIComponent(toSnapshot.id)}`, authHeader);
      assert(compare && Array.isArray(compare.items), 'PlayerTracking inventory compare response is not valid.');
    }
    return `enabled=${status.isEnabled}, sessions=${status.sessionCount ?? 0}, checkedPlayer=${firstPlayer.playerId}, activities=${activities.items.length}/${activities.total ?? '?'}, track=${track.points.length}/${track.totalPoints ?? '?'}, region=${region.items.length}/${region.total ?? '?'}`;
  }

  return `enabled=${status.isEnabled}, sessions=${status.sessionCount ?? 0}, no history player available`;
});

for (const result of results) {
  const line = `${result.status} ${result.name} (${result.durationMs}ms)`;
  console.log(result.details ? `${line}: ${result.details}` : `${line}${result.error ? `: ${result.error}` : ''}`);
}

const failed = results.filter(result => result.status === 'FAIL');
if (failed.length > 0) {
  console.error(`Live smoke failed: ${failed.length}/${results.length} checks failed.`);
  process.exitCode = 1;
}
else {
  console.log(`Live smoke passed: ${results.length}/${results.length} checks passed.`);
}
