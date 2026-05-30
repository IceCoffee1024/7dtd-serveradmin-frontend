function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function buildApiUrl(path: string): string {
  const baseUrl = trimTrailingSlash(import.meta.env.VITE_OPENAPI_BASE_URL || '');
  return `${baseUrl}/api/GameServer/${path}`;
}

function withColorSuffix(name: string, iconColor?: string | null): string {
  return iconColor && iconColor.toUpperCase() !== 'FFFFFF'
    ? `${name}__${iconColor}`
    : name;
}

export function getItemIconUrl(name: string, iconColor?: string | null): string {
  return buildApiUrl(`ItemIcons/${withColorSuffix(name, iconColor)}.png`);
}

export function getUiIconUrl(name: string, iconColor?: string | null): string {
  return buildApiUrl(`UiIcons/${withColorSuffix(name, iconColor)}.png`);
}

export function getMapTileUrl(z: number, x: number, y: number, accessToken: string): string {
  return `${buildApiUrl(`MapTile/${z}/${x}/${y}.png`)}?access_token=${encodeURIComponent(accessToken)}`;
}
