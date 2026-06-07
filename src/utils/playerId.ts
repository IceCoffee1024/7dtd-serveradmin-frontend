const STEAM_ID64_PATTERN = /^[1-9]\d{16}$/;
const STEAM_COMBINED_ID_PATTERN = /^Steam_[1-9]\d{16}$/;
const EOS_COMBINED_ID_PATTERN = /^EOS_[\w-]{8,}$/;
const GENERIC_COMBINED_ID_PATTERN = /^[a-z][\da-z]{1,15}_[\w-]{3,}$/i;

/**
 * Normalizes user-entered player identifiers to the backend's combined format.
 * Bare SteamID64 values are accepted for operator convenience.
 */
export function normalizePlayerIdInput(value: string): string {
  const trimmed = value.trim();
  return STEAM_ID64_PATTERN.test(trimmed) ? `Steam_${trimmed}` : trimmed;
}

export function isValidPlayerIdInput(value: string): boolean {
  const normalized = normalizePlayerIdInput(value);

  return STEAM_COMBINED_ID_PATTERN.test(normalized)
    || EOS_COMBINED_ID_PATTERN.test(normalized)
    || GENERIC_COMBINED_ID_PATTERN.test(normalized);
}
